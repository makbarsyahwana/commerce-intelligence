import { prisma } from "../prisma";
import { OrderResponse } from "./fetchProviders";
import { ProviderConfig } from "../providers/config";
import { createLogger } from "../../lib/logger";

// Add small random variation to make charts more interesting
function addVariation(value: number, percentage: number = 0.05): number {
  const variation = 1 - percentage + Math.random() * (percentage * 2);
  return Number((value * variation).toFixed(2));
}

interface ConcurrentBatchConfig {
  concurrentLimit: number;
  batchSize: number;
  batchTimeout: number;
  pauseBetweenBatches: number;
}

export async function upsertOrdersConcurrent(
  orders: OrderResponse[], 
  provider: ProviderConfig,
  config: ConcurrentBatchConfig = {
    concurrentLimit: 3,    // Process 3 batches at once
    batchSize: 50,        // 50 orders per batch
    batchTimeout: 30000,  // 30s per batch
    pauseBetweenBatches: 100, // 100ms between batch groups
  }
) {
  const logger = createLogger({ 
    operation: 'upsertOrdersConcurrent', 
    provider: provider.name,
    orderCount: orders.length,
    config,
  });
  
  const syncedAt = new Date();
  const variations = provider.variations || {
    totalPrice: 0.03,
  };
  
  logger.info(`Starting concurrent upsert for ${orders.length} orders`);

  try {
    // Create batches
    const batches: OrderResponse[][] = [];
    for (let i = 0; i < orders.length; i += config.batchSize) {
      batches.push(orders.slice(i, i + config.batchSize));
    }

    logger.info(`Processing ${batches.length} batches with concurrency limit ${config.concurrentLimit}`);

    // Process batches in controlled concurrent groups
    for (let i = 0; i < batches.length; i += config.concurrentLimit) {
      const concurrentBatches = batches.slice(i, i + config.concurrentLimit);
      
      logger.debug(`Processing batch group ${Math.floor(i/config.concurrentLimit) + 1}`, {
        batchesInGroup: concurrentBatches.length,
        batchStartIndex: i,
        batchEndIndex: Math.min(i + config.concurrentLimit, batches.length),
      });

      // Process this group of batches concurrently
      const batchPromises = concurrentBatches.map(async (batch, batchIndex) => {
        const globalBatchIndex = i + batchIndex;
        const batchLogger = createLogger({
          operation: 'upsertOrdersConcurrent',
          provider: provider.name,
          batchNumber: globalBatchIndex + 1,
          batchSize: batch.length,
        });

        try {
          batchLogger.debug(`Starting batch transaction`);

          await prisma.$transaction(async (tx) => {
            for (const order of batch) {
              // Add provider-specific variation to total price
              const variedTotalPrice = addVariation(Number(order.total_price), variations.totalPrice);
              
              await tx.order.upsert({
                where: { 
                  provider_providerOrderId: {
                    provider: provider.name,
                    providerOrderId: order.order_id,
                  }
                },
                update: {
                  providerUserId: order.user_id,
                  status: order.status,
                  totalPrice: variedTotalPrice,
                  syncedAt,
                },
                create: {
                  provider: provider.name,
                  providerOrderId: order.order_id,
                  providerUserId: order.user_id,
                  status: order.status,
                  totalPrice: variedTotalPrice,
                  syncedAt,
                },
              });
            }
          }, {
            timeout: config.batchTimeout,
          });

          batchLogger.debug(`Completed batch transaction successfully`);
          return { success: true, batchIndex: globalBatchIndex, itemCount: batch.length };

        } catch (error) {
          batchLogger.error(`Batch transaction failed`, {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return { 
            success: false, 
            batchIndex: globalBatchIndex, 
            itemCount: batch.length,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      // Wait for all batches in this group to complete
      const results = await Promise.all(batchPromises);
      
      // Log results for this batch group
      const successfulBatches = results.filter(r => r.success);
      const failedBatches = results.filter(r => !r.success);
      
      logger.info(`Batch group completed`, {
        successfulBatches: successfulBatches.length,
        failedBatches: failedBatches.length,
        itemsProcessed: successfulBatches.reduce((sum, r) => sum + r.itemCount, 0),
        itemsFailed: failedBatches.reduce((sum, r) => sum + r.itemCount, 0),
      });

      // If any batches failed, throw an error with details
      if (failedBatches.length > 0) {
        const errorDetails = failedBatches.map(b => 
          `Batch ${b.batchIndex + 1}: ${b.error}`
        ).join('; ');
        throw new Error(`${failedBatches.length} batches failed: ${errorDetails}`);
      }

      // Brief pause to let other requests through and reduce pool pressure
      if (i + config.concurrentLimit < batches.length) {
        logger.debug(`Pausing ${config.pauseBetweenBatches}ms before next batch group`);
        await new Promise(resolve => setTimeout(resolve, config.pauseBetweenBatches));
      }
    }

    logger.info(`Successfully upserted ${orders.length} orders concurrently`);

  } catch (error) {
    logger.error(`Concurrent upsert failed`, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      orderCount: orders.length,
    });
    throw error;
  }
}
