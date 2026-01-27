import { prisma } from "../../container/prisma";
import { OrderResponse } from "../fetch";
import { ProviderConfig } from "../../providers/config";
import { createLogger } from "../../container/logger";
import { OrderItemRepository } from "../../repositories/OrderItemRepository";

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
    const batchSize = 50;
    const batches: OrderResponse[][] = [];
    
    for (let i = 0; i < orders.length; i += batchSize) {
      batches.push(orders.slice(i, i + batchSize));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      logger.debug(`Processing batch ${batchIndex + 1}/${batches.length}`, { 
        batchSize: batch.length 
      });

      for (const order of batch) {
        try {
          const result = await prisma.$transaction(async (tx) => {
            const orderItemRepo = new OrderItemRepository(tx);
            return orderItemRepo.reconcileOrderItemsForOrder(order, provider, syncedAt, {
              quantity: variations.quantity,
              unitPrice: variations.unitPrice,
            });
          });

          if (result.skipped) {
            logger.warn(`Order not found for reconciliation`, {
              provider: provider.name,
              providerOrderId: order.order_id,
            });
            continue;
          }

          logger.debug(`Reconciled order items`, {
            providerOrderId: order.order_id,
            originalItems: result.originalItems,
            createdItems: result.createdItems,
          });
        } catch (error) {
          logger.error(`Failed to reconcile order items`, {
            provider: provider.name,
            providerOrderId: order.order_id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

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
