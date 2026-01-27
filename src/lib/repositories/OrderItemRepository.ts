import { BaseRepository, TransactionClient } from "./BaseRepository";
import { addVariation } from "../sync/variation";
import type { OrderResponse } from "../sync/fetch";
import type { ProviderConfig } from "../providers/config";

type ReconcileItemVariations = {
  quantity: boolean;
  unitPrice: number;
};

type ReconcileResult = {
  createdItems: number;
  originalItems: number;
  skipped: boolean;
};

export class OrderItemRepository extends BaseRepository {
  constructor(tx?: TransactionClient) {
    super(tx);
  }

  async reconcileOrderItemsForOrder(
    order: OrderResponse,
    provider: ProviderConfig,
    syncedAt: Date,
    variations: ReconcileItemVariations
  ): Promise<ReconcileResult> {
    if (!order.items || order.items.length === 0) {
      return { createdItems: 0, originalItems: 0, skipped: false };
    }

    const dbOrder = await this.prisma.order.findUnique({
      where: {
        provider_providerOrderId: {
          provider: provider.name,
          providerOrderId: order.order_id,
        },
      },
      select: { id: true },
    });

    if (!dbOrder) {
      return { createdItems: 0, originalItems: order.items.length, skipped: true };
    }

    await this.prisma.orderItem.deleteMany({ where: { orderId: dbOrder.id } });

    const baseUnitPrice = Number(order.total_price) / order.items.length;

    const providerProductIds = order.items.map((item) => item.product_id);

    const products = await this.prisma.product.findMany({
      where: {
        provider: provider.name,
        providerProductId: { in: providerProductIds },
      },
      select: { id: true, providerProductId: true },
    });

    const productMap = new Map(products.map((p) => [p.providerProductId, p.id]));

    const itemsToCreate = order.items
      .map((item) => {
        const productId = productMap.get(item.product_id);
        if (!productId) return null;

        const variedQuantity = variations.quantity
          ? Math.max(1, item.quantity + (Math.random() > 0.5 ? 1 : -1))
          : item.quantity;

        const variedUnitPrice = addVariation(baseUnitPrice, variations.unitPrice);

        return {
          orderId: dbOrder.id,
          productId,
          quantity: variedQuantity,
          unitPriceSnapshot: variedUnitPrice,
          syncedAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (itemsToCreate.length > 0) {
      await this.prisma.orderItem.createMany({ data: itemsToCreate });
    }

    return {
      createdItems: itemsToCreate.length,
      originalItems: order.items.length,
      skipped: false,
    };
  }
}
