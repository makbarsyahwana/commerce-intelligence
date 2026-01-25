import { prisma } from "../prisma";
import { OrderResponse } from "./fetchProviders";
import { ProviderConfig } from "../providers/config";
import { createLogger } from "../../lib/logger";

// Add small random variation to make charts more interesting
function addVariation(value: number, percentage: number = 0.05): number {
  const variation = 1 - percentage + Math.random() * (percentage * 2);
  return Number((value * variation).toFixed(2));
}

export async function upsertOrdersWithTransaction(
  orders: OrderResponse[], 
  provider: ProviderConfig
) {
  const logger = createLogger({ 
    operation: 'upsertOrdersWithTransaction', 
    provider: provider.name,
    orderCount: orders.length,
  });
  
  const syncedAt = new Date();
  const variations = provider.variations || {
    totalPrice: 0.03,
  };
  
  logger.info(`Starting transactional upsert for ${orders.length} orders`);

  try {
    // Process in batches to avoid transaction timeouts
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < orders.length; i += batchSize) {
      batches.push(orders.slice(i, i + batchSize));
    }

    logger.info(`Processing ${batches.length} batches of up to ${batchSize} orders each`);

    for (const [batchIndex, batch] of batches.entries()) {
      logger.debug(`Processing batch ${batchIndex + 1}/${batches.length}`, { 
        batchSize: batch.length 
      });

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
        timeout: 30000, // 30 seconds timeout per batch
      });

      logger.debug(`Completed batch ${batchIndex + 1}/${batches.length}`);
    }

    logger.info(`Successfully upserted ${orders.length} orders in ${batches.length} batches`);
    
  } catch (error) {
    logger.error(`Transactional upsert failed`, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      orderCount: orders.length,
    });
    throw error;
  }
}
