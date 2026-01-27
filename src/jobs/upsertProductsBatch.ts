import { task } from "@trigger.dev/sdk";
import { prisma } from "../lib/container/prisma";
import { ProductRepository } from "../lib/repositories/ProductRepository";
import { createLogger } from "../lib/container/logger";
import type { ProviderConfig } from "../types/providers";
import type { ProductResponse } from "../types/api";

type ProviderPayload = {
  name: string;
  variations?: ProviderConfig["variations"];
};

export const upsertProductsBatch = task({
  id: "upsert-products-batch",
  queue: {
    name: "sync-batches",
    concurrencyLimit: Number(process.env.SYNC_BATCH_CONCURRENCY_LIMIT ?? 5),
  },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: {
    provider: ProviderPayload;
    products: ProductResponse[];
    syncedAt: string;
    batchTimeoutMs?: number;
  }) => {
    const logger = createLogger({
      operation: "upsertProductsBatch",
      provider: payload.provider.name,
      batchSize: payload.products.length,
    });

    const syncedAt = new Date(payload.syncedAt);

    logger.debug("Starting batch transaction");

    try {
      await prisma.$transaction(
        async (tx) => {
          const productRepo = new ProductRepository(tx);
          const provider = payload.provider as ProviderConfig;

          for (const product of payload.products) {
            await productRepo.upsertProduct(product, provider, syncedAt);
            await productRepo.upsertProductReviews(product, provider, syncedAt);
          }
        },
        {
          timeout: payload.batchTimeoutMs ?? 30000,
        }
      );

      logger.debug("Completed batch transaction successfully");

      return { success: true, processed: payload.products.length };
    } catch (error) {
      logger.error("Batch transaction failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
