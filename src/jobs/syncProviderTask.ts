import { task } from "@trigger.dev/sdk";
import { upsertProductsBatch } from "./upsertProductsBatch";
import { upsertOrdersBatch } from "./upsertOrdersBatch";
import { fetchProducts, fetchOrders } from "../lib/sync/fetch";
import { reconcileOrderItems } from "../lib/sync/upsert";
import { createDefaultConcurrentConfig } from "../lib/sync/config";
import { createLogger } from "../lib/container/logger";
import type { ProviderConfig } from "../types/providers";

type ProviderPayload = {
  name: string;
  productsApi: string;
  ordersApi: string;
  auth?: string;
  rateLimit?: { requests: number; window: number };
  variations?: ProviderConfig["variations"];
};

export const syncProviderTask = task({
  id: "sync-provider",
  queue: {
    name: "sync-providers",
    concurrencyLimit: 5, // Max 5 providers syncing at once
  },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: {
    provider: ProviderPayload;
    syncRunId: string;
    syncedAt: string;
  }) => {
    const logger = createLogger({
      operation: "syncProviderTask",
      provider: payload.provider.name,
    });

    const config = createDefaultConcurrentConfig();
    const syncedAt = new Date(payload.syncedAt);
    const provider = payload.provider as ProviderConfig;

    logger.info("Starting provider sync task", {
      provider: provider.name,
      syncRunId: payload.syncRunId,
    });

    // Fetch data from provider APIs
    const [products, orders] = await Promise.all([
      fetchProducts(provider),
      fetchOrders(provider),
    ]);

    logger.info("Fetched provider data", {
      products: products.length,
      orders: orders.length,
    });

    // Create product batches and process sequentially (not Promise.all)
    const productBatches = createBatches(products, config.batchSize);
    for (const [batchIndex, batch] of productBatches.entries()) {
      const result = await upsertProductsBatch.triggerAndWait({
        provider: { name: provider.name, variations: provider.variations },
        products: batch,
        syncedAt: syncedAt.toISOString(),
        batchTimeoutMs: config.batchTimeout,
      }, {
        queue: "sync-batches",
        concurrencyKey: provider.name,
        idempotencyKey: `${provider.name}:${syncedAt.toISOString()}:products:${batchIndex}`,
      });

      if (!result.ok) {
        throw new Error(`Product sync failed at batch ${batchIndex}: ${result.error}`);
      }
    }

    // Create order batches and process sequentially (not Promise.all)
    const orderBatches = createBatches(orders, config.batchSize);
    for (const [batchIndex, batch] of orderBatches.entries()) {
      const result = await upsertOrdersBatch.triggerAndWait({
        provider: { name: provider.name, variations: provider.variations },
        orders: batch,
        syncedAt: syncedAt.toISOString(),
        batchTimeoutMs: config.batchTimeout,
      }, {
        queue: "sync-batches",
        concurrencyKey: provider.name,
        idempotencyKey: `${provider.name}:${syncedAt.toISOString()}:orders:${batchIndex}`,
      });

      if (!result.ok) {
        throw new Error(`Order sync failed at batch ${batchIndex}: ${result.error}`);
      }
    }

    // Reconcile order items
    await reconcileOrderItems(orders, provider);

    logger.info("Provider sync completed", {
      productsProcessed: products.length,
      ordersProcessed: orders.length,
    });

    return {
      provider: provider.name,
      productsProcessed: products.length,
      ordersProcessed: orders.length,
    };
  },
});

function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
