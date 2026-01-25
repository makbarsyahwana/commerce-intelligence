import { BaseRepository } from "./BaseRepository";
import { OrderResponse } from "../sync/fetchProviders";
import { ProviderConfig } from "../providers/config";
import { applyOrderVariations } from "../sync/variationUtils";

export class OrderRepository extends BaseRepository {
  constructor() {
    super('Order');
  }

  async upsertOrder(order: OrderResponse, provider: ProviderConfig, syncedAt: Date) {
    try {
      const { variedTotalPrice } = applyOrderVariations(
        Number(order.total_price),
        provider.variations
      );

      const result = await this.prisma.order.upsert({
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

      this.logSuccess('Order upserted', { 
        providerOrderId: order.order_id,
        provider: provider.name 
      });

      return result;
    } catch (error) {
      this.handleError(error, 'Order upsert');
    }
  }

  async upsertOrders(orders: OrderResponse[], provider: ProviderConfig, syncedAt: Date) {
    const results = await Promise.all(
      orders.map(order => this.upsertOrder(order, provider, syncedAt))
    );

    this.logSuccess('Orders batch upserted', { 
      count: orders.length,
      provider: provider.name 
    });

    return results;
  }
}
