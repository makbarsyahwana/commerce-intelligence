import { prisma } from "../prisma";
import { ProductResponse } from "./fetchProviders";
import { ProviderConfig } from "../providers/config";
import { createLogger } from "../../lib/logger";

// Add small random variation to make charts more interesting
function addVariation(value: number, percentage: number = 0.05): number {
  const variation = 1 - percentage + Math.random() * (percentage * 2);
  return Number((value * variation).toFixed(2));
}

export async function upsertProductsWithTransaction(
  products: ProductResponse[], 
  provider: ProviderConfig
) {
  const logger = createLogger({ 
    operation: 'upsertProductsWithTransaction', 
    provider: provider.name,
    productCount: products.length,
  });
  
  const syncedAt = new Date();
  const variations = provider.variations || {
    price: 0.05,
    discount: 0.10,
    rating: 0.05,
  };
  
  logger.info(`Starting transactional upsert for ${products.length} products`);

  try {
    // Process in batches to avoid transaction timeouts
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    logger.info(`Processing ${batches.length} batches of up to ${batchSize} products each`);

    for (const [batchIndex, batch] of batches.entries()) {
      logger.debug(`Processing batch ${batchIndex + 1}/${batches.length}`, { 
        batchSize: batch.length 
      });

      await prisma.$transaction(async (tx) => {
        for (const product of batch) {
          // Add provider-specific variations
          const variedPrice = addVariation(Number(product.price), variations.price);
          const variedDiscount = product.discount ? addVariation(Number(product.discount), variations.discount) : null;
          const variedRating = product.rating ? addVariation(Number(product.rating), variations.rating) : null;
          
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
            for (const review of product.reviews) {
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
        }
      }, {
        timeout: 30000, // 30 seconds timeout per batch
      });

      logger.debug(`Completed batch ${batchIndex + 1}/${batches.length}`);
    }

    logger.info(`Successfully upserted ${products.length} products in ${batches.length} batches`);
    
  } catch (error) {
    logger.error(`Transactional upsert failed`, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      productCount: products.length,
    });
    throw error;
  }
}
