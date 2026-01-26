import { prisma } from "../prisma";
import { ProductResponse } from "./fetchProviders";
import { ProviderConfig } from "../providers/config";
import { createLogger } from "../../lib/logger";
import { Logger } from "../../types/logger";
import { ConcurrentBatchConfig, PrismaTransaction } from "../../types/sync";
import { createDefaultConcurrentConfig } from "./constants";
import { applyProductVariations } from "./variationUtils";

export async function upsertProductsConcurrent(
  products: ProductResponse[], 
  provider: ProviderConfig,
  config: ConcurrentBatchConfig = createDefaultConcurrentConfig()
) {
  const logger = createLogger({ 
    operation: 'upsertProductsConcurrent', 
    provider: provider.name,
    productCount: products.length,
    config,
  });
  
  const syncedAt = new Date();
  
  logger.info(`Starting concurrent upsert for ${products.length} products`);

  try {
    const batches = createBatches(products, config.batchSize);
    logger.info(`Processing ${batches.length} batches with concurrency limit ${config.concurrentLimit}`);

    await processBatchGroups(batches, config, logger, provider, syncedAt);
    logger.info(`Successfully upserted ${products.length} products concurrently`);

  } catch (error) {
    logger.error(`Concurrent upsert failed`, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productCount: products.length,
    });
    throw error;
  }
}

function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

async function processBatchGroups(
  batches: ProductResponse[][],
  config: ConcurrentBatchConfig,
  logger: Logger,
  provider: ProviderConfig,
  syncedAt: Date
) {
  for (let i = 0; i < batches.length; i += config.concurrentLimit) {
    const concurrentBatches = batches.slice(i, i + config.concurrentLimit);
    
    logger.debug(`Processing batch group ${Math.floor(i/config.concurrentLimit) + 1}`, {
      batchesInGroup: concurrentBatches.length,
      batchStartIndex: i,
      batchEndIndex: Math.min(i + config.concurrentLimit, batches.length),
    });

    const results = await Promise.all(
      concurrentBatches.map((batch, batchIndex) => 
        processBatch(batch, i + batchIndex, provider, syncedAt, config.batchTimeout)
      )
    );

    const failedBatches = results.filter(r => !r.success);
    if (failedBatches.length > 0) {
      const errorDetails = failedBatches.map(b => `Batch ${b.batchIndex + 1}: ${b.error}`).join('; ');
      throw new Error(`${failedBatches.length} batches failed: ${errorDetails}`);
    }

    // Brief pause to let other requests through
    if (i + config.concurrentLimit < batches.length) {
      logger.debug(`Pausing ${config.pauseBetweenBatches}ms before next batch group`);
      await new Promise(resolve => setTimeout(resolve, config.pauseBetweenBatches));
    }
  }
}

async function processBatch(
  batch: ProductResponse[],
  batchIndex: number,
  provider: ProviderConfig,
  syncedAt: Date,
  timeout: number
) {
  const batchLogger = createLogger({
    operation: 'upsertProductsConcurrent',
    provider: provider.name,
    batchNumber: batchIndex + 1,
    batchSize: batch.length,
  });

  try {
    batchLogger.debug(`Starting batch transaction`);

    await prisma.$transaction(async (tx) => {
      for (const product of batch) {
        await upsertProductInTransaction(tx, product, provider, syncedAt);
      }
    }, { timeout });

    batchLogger.debug(`Completed batch transaction successfully`);
    return { success: true, batchIndex, itemCount: batch.length };

  } catch (error) {
    batchLogger.error(`Batch transaction failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { 
      success: false, 
      batchIndex, 
      itemCount: batch.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function upsertProductInTransaction(
  tx: PrismaTransaction,
  product: ProductResponse,
  provider: ProviderConfig,
  syncedAt: Date
) {
  const { variedPrice, variedDiscount, variedRating } = applyProductVariations(
    Number(product.price),
    product.discount,
    product.rating,
    provider.variations
  );
  
  await tx.product.upsert({
    where: { 
      provider_providerProductId: {
        provider: provider.name,
        providerProductId: product.product_id,
      }
    },
    update: {
      name: product.name,
      description: product.description,
      image: product.image,
      price: variedPrice,
      discount: variedDiscount,
      availability: product.availability,
      brand: product.brand,
      category: product.category,
      rating: variedRating,
      syncedAt,
    },
    create: {
      provider: provider.name,
      providerProductId: product.product_id,
      name: product.name,
      description: product.description,
      image: product.image,
      price: variedPrice,
      discount: variedDiscount,
      availability: product.availability,
      brand: product.brand,
      category: product.category,
      rating: variedRating,
      syncedAt,
    },
  });

  // Handle reviews if present (in same transaction)
  if (product.reviews && product.reviews.length > 0) {
    await handleProductReviews(tx, product, provider, syncedAt);
  }
}

async function handleProductReviews(
  tx: PrismaTransaction,
  product: ProductResponse,
  provider: ProviderConfig,
  syncedAt: Date
) {
  // Delete existing reviews for this product
  await tx.productReview.deleteMany({
    where: {
      product: {
        provider: provider.name,
        providerProductId: product.product_id,
      }
    }
  });

  // Create new reviews
  for (const review of product.reviews!) {
    await tx.productReview.create({
      data: {
        product: {
          connect: {
            provider_providerProductId: {
              provider: provider.name,
              providerProductId: product.product_id,
            }
          }
        },
        providerUserId: review.user_id,
        rating: review.rating,
        comment: review.comment,
        syncedAt,
      },
    });
  }
}
