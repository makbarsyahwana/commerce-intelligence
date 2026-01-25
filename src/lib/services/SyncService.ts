import { ProductRepository } from "../repositories/ProductRepository";
import { OrderRepository } from "../repositories/OrderRepository";
import { SyncRunRepository } from "../repositories/SyncRunRepository";
import { createLogger, Logger } from "../logger";
import { ProductResponse, OrderResponse } from "../sync/fetchProviders";
import { ProviderConfig } from "../providers/config";
import { getSyncStrategy } from "../sync/syncConfig";
import { ConcurrentBatchConfig } from "../sync/constants";

export interface SyncResult {
  success: boolean;
  productsProcessed: number;
  ordersProcessed: number;
  error?: string;
  duration: number;
}

export class SyncService {
  private logger: Logger;
  private productRepo: ProductRepository;
  private orderRepo: OrderRepository;
  private syncRunRepo: SyncRunRepository;

  constructor() {
    this.logger = createLogger({ operation: 'SyncService' });
    this.productRepo = new ProductRepository();
    this.orderRepo = new OrderRepository();
    this.syncRunRepo = new SyncRunRepository();
  }

  async syncProvider(
    provider: ProviderConfig,
    products: ProductResponse[],
    orders: OrderResponse[]
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const logger = createLogger({ 
      operation: 'SyncService', 
      provider: provider.name 
    });

    try {
      logger.info('Starting provider sync', { 
        productCount: products.length,
        orderCount: orders.length 
      });

      const strategy = getSyncStrategy();
      const syncedAt = new Date();

      // Process products
      let productsProcessed = 0;
      if (strategy.useConcurrent && strategy.concurrentConfig) {
        productsProcessed = await this.syncProductsConcurrent(
          products, provider, syncedAt, strategy.concurrentConfig
        );
      } else {
        await this.syncProductsSequential(products, provider, syncedAt);
        productsProcessed = products.length;
      }

      // Process orders
      let ordersProcessed = 0;
      if (strategy.useConcurrent && strategy.concurrentConfig) {
        ordersProcessed = await this.syncOrdersConcurrent(
          orders, provider, syncedAt, strategy.concurrentConfig
        );
      } else {
        await this.syncOrdersSequential(orders, provider, syncedAt);
        ordersProcessed = orders.length;
      }

      const duration = Date.now() - startTime;
      logger.info('Provider sync completed', {
        productsProcessed,
        ordersProcessed,
        duration,
        strategy: strategy.name
      });

      return {
        success: true,
        productsProcessed,
        ordersProcessed,
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Provider sync failed', {
        error: errorMessage,
        duration,
      });

      return {
        success: false,
        productsProcessed: 0,
        ordersProcessed: 0,
        error: errorMessage,
        duration,
      };
    }
  }

  private async syncProductsSequential(
    products: ProductResponse[],
    provider: ProviderConfig,
    syncedAt: Date
  ): Promise<void> {
    await this.productRepo.upsertProductsWithReviews(products, provider, syncedAt);
  }

  private async syncProductsConcurrent(
    products: ProductResponse[],
    provider: ProviderConfig,
    syncedAt: Date,
    config: ConcurrentBatchConfig
  ): Promise<number> {
    // Import here to avoid circular dependency
    const { upsertProductsConcurrent } = await import("../sync/upsertProductsConcurrent");
    await upsertProductsConcurrent(products, provider, config);
    return products.length;
  }

  private async syncOrdersSequential(
    orders: OrderResponse[],
    provider: ProviderConfig,
    syncedAt: Date
  ): Promise<void> {
    await this.orderRepo.upsertOrders(orders, provider, syncedAt);
  }

  private async syncOrdersConcurrent(
    orders: OrderResponse[],
    provider: ProviderConfig,
    syncedAt: Date,
    config: ConcurrentBatchConfig
  ): Promise<number> {
    // Import here to avoid circular dependency
    const { upsertOrdersConcurrent } = await import("../sync/upsertOrdersConcurrent");
    await upsertOrdersConcurrent(orders, provider, config);
    return orders.length;
  }

  async createSyncRun(provider?: string) {
    return this.syncRunRepo.create({
      startedAt: new Date(),
      syncedAt: new Date(),
      status: 'RUNNING',
      provider,
    });
  }

  async updateSyncRun(id: string, result: SyncResult) {
    return this.syncRunRepo.update(id, {
      status: result.success ? 'SUCCESS' : 'FAILED',
      finishedAt: new Date(),
      errorMessage: result.error,
      productsFetched: result.productsProcessed,
      ordersFetched: result.ordersProcessed,
    });
  }

  async getLatestSyncRun(provider?: string) {
    return this.syncRunRepo.findLatest(provider);
  }

  async getRecentSyncRuns(limit: number = 10) {
    return this.syncRunRepo.findRecent(limit);
  }
}
