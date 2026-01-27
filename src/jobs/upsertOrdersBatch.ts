import { task } from "@trigger.dev/sdk";
import { prisma } from "../lib/container/prisma";
import { OrderRepository } from "../lib/repositories/OrderRepository";
import { createLogger } from "../lib/container/logger";
import type { ProviderConfig } from "../types/providers";
import type { OrderResponse } from "../types/api";

type ProviderPayload = {
  name: string;
  variations?: ProviderConfig["variations"];
};

export const upsertOrdersBatch = task({
  id: "upsert-orders-batch",
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
    orders: OrderResponse[];
    syncedAt: string;
    batchTimeoutMs?: number;
  }) => {
    const logger = createLogger({
      operation: "upsertOrdersBatch",
      provider: payload.provider.name,
      batchSize: payload.orders.length,
    });

    const syncedAt = new Date(payload.syncedAt);

    logger.debug("Starting batch transaction");

    try {
      await prisma.$transaction(
        async (tx) => {
          const orderRepo = new OrderRepository(tx);
          const provider = payload.provider as ProviderConfig;

          for (const order of payload.orders) {
            await orderRepo.upsertOrder(order, provider, syncedAt);
          }
        },
        {
          timeout: payload.batchTimeoutMs ?? 30000,
        }
      );

      logger.debug("Completed batch transaction successfully");

      return { success: true, processed: payload.orders.length };
    } catch (error) {
      logger.error("Batch transaction failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});
