import { prisma } from "../prisma";
import { OrderResponse } from "./fetchProviders";
import { ProviderConfig } from "../providers/config";
import { createLogger } from "../../lib/logger";

// Add small random variation to make charts more interesting
function addVariation(value: number, percentage: number = 0.05): number {
  const variation = 1 - percentage + Math.random() * (percentage * 2);
  return Number((value * variation).toFixed(2));
}

export async function reconcileOrderItems(
  orders: OrderResponse[], 
  provider: ProviderConfig
) {
  const logger = createLogger({ 
    operation: 'reconcileOrderItems', 
    provider: provider.name,
    orderCount: orders.length,
  });
  
  const syncedAt = new Date();
  const variations = provider.variations || {
    quantity: true,
    unitPrice: 0.02,
  };
  
  logger.info(`Reconciling order items for ${orders.length} orders`);

  try {
    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < orders.length; i += batchSize) {
      batches.push(orders.slice(i, i + batchSize));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      logger.debug(`Processing batch ${batchIndex + 1}/${batches.length}`, { 
        batchSize: batch.length 
      });

      // Process each order in a transaction for atomicity
      await Promise.allSettled(
        batch.map(async (order) => {
          try {
            // Find the order by provider and providerOrderId
            const dbOrder = await prisma.order.findUnique({
              where: {
                provider_providerOrderId: {
                  provider: provider.name,
                  providerOrderId: order.order_id,
                }
              },
              select: { id: true }
            });

            if (!dbOrder) {
              logger.warn(`Order not found for reconciliation`, {
                provider: provider.name,
                providerOrderId: order.order_id,
              });
              return;
            }

            // Delete existing order items for this order (in transaction)
            await prisma.$transaction(async (tx) => {
              await tx.orderItem.deleteMany({
                where: { orderId: dbOrder.id }
              });

              // Create new order items with variations
              const itemsToCreate = order.items.map(item => {
                // Add variation to quantity (minimum 1)
                const variedQuantity = variations.quantity ? 
                  Math.max(1, item.quantity + (Math.random() > 0.5 ? 1 : -1)) : 
                  item.quantity;

                // Add variation to unit price
                const baseUnitPrice = Number(order.total_price) / order.items.length; // Rough estimate
                const variedUnitPrice = addVariation(baseUnitPrice, variations.unitPrice);

                return {
                  orderId: dbOrder.id,
                  productId: item.product_id.toString(), // This will need to be resolved to actual product ID
                  quantity: variedQuantity,
                  unitPriceSnapshot: variedUnitPrice,
                  syncedAt,
                };
              });

              // We need to resolve product IDs first
              const productIds = itemsToCreate.map(item => item.productId);
              const products = await tx.product.findMany({
                where: {
                  provider: provider.name,
                  providerProductId: { in: productIds.map(id => parseInt(id)) }
                },
                select: { id: true, providerProductId: true }
              });

              const productMap = new Map(
                products.map(p => [p.providerProductId.toString(), p.id])
              );

              const validItemsToCreate = itemsToCreate
                .filter(item => productMap.has(item.productId))
                .map(item => ({
                  ...item,
                  productId: productMap.get(item.productId)!,
                }));

              if (validItemsToCreate.length > 0) {
                await tx.orderItem.createMany({
                  data: validItemsToCreate,
                });
              }

              logger.debug(`Reconciled order items`, {
                providerOrderId: order.order_id,
                originalItems: order.items.length,
                createdItems: validItemsToCreate.length,
              });
            });

          } catch (error) {
            logger.error(`Failed to reconcile order items`, {
              provider: provider.name,
              providerOrderId: order.order_id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
          }
        })
      );

      logger.debug(`Completed batch ${batchIndex + 1}/${batches.length}`);
    }

    logger.info(`Successfully reconciled order items for ${orders.length} orders`);

  } catch (error) {
    logger.error(`Order items reconciliation failed`, { 
      error: error instanceof Error ? error.message : 'Unknown error',
      orderCount: orders.length,
    });
    throw error;
  }
}
