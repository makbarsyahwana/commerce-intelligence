import { task, tasks, schedules } from "@trigger.dev/sdk";
import { getAllProviders } from "../lib/providers/config";
import { createLogger } from "../lib/container/logger";
import { SyncRunRepository } from "../lib/repositories/SyncRunRepository";

type ProviderSyncResult = {
  provider: string;
  productsProcessed: number;
  ordersProcessed: number;
};

export const syncEcommerceSnapshot = task({
  id: "sync-ecommerce-snapshot",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async () => {
    const logger = createLogger({ operation: "syncEcommerceSnapshot" });
    const syncRunRepo = new SyncRunRepository();
    const providers = getAllProviders();
    const syncedAt = new Date();

    // Create SyncRun record with status RUNNING
    const syncRun = await syncRunRepo.create({
      startedAt: syncedAt,
      syncedAt,
      status: "RUNNING",
      provider: "all",
    });

    logger.info("Starting multi-provider sync", {
      syncRunId: syncRun!.id,
      providerCount: providers.length,
      providers: providers.map((p) => p.name),
    });

    try {
      // Trigger all provider syncs in parallel via Trigger.dev
      const results = await tasks.batchTriggerAndWait(
        "sync-provider" as const,
        providers.map((provider) => ({
          payload: {
            provider: {
              name: provider.name,
              productsApi: provider.productsApi,
              ordersApi: provider.ordersApi,
              auth: provider.auth,
              rateLimit: provider.rateLimit,
              variations: provider.variations,
            },
            syncRunId: syncRun!.id,
            syncedAt: syncedAt.toISOString(),
          },
          options: {
            queue: "sync-providers",
            concurrencyKey: provider.name,
            idempotencyKey: `${provider.name}:${syncedAt.toISOString()}`,
          },
        }))
      );

      const failed = results.runs.filter((r) => !r.ok);
      const succeeded = results.runs.filter((r) => r.ok);

      // Aggregate counts from successful runs
      let totalProducts = 0;
      let totalOrders = 0;

      for (const run of succeeded) {
        if (run.ok && run.output) {
          const output = run.output as ProviderSyncResult;
          totalProducts += output.productsProcessed || 0;
          totalOrders += output.ordersProcessed || 0;
        }
      }

      logger.info("Multi-provider sync completed", {
        syncRunId: syncRun!.id,
        total: providers.length,
        succeeded: succeeded.length,
        failed: failed.length,
        totalProducts,
        totalOrders,
      });

      if (failed.length > 0) {
        const errors = failed
          .map((r) => (r.error instanceof Error ? r.error.message : String(r.error)))
          .join("; ");

        // Update SyncRun with FAILED status
        await syncRunRepo.update(syncRun!.id, {
          status: "FAILED",
          finishedAt: new Date(),
          errorMessage: `${failed.length} providers failed: ${errors}`,
          productsFetched: totalProducts,
          ordersFetched: totalOrders,
        });

        throw new Error(`${failed.length} providers failed: ${errors}`);
      }

      // Update SyncRun with SUCCESS status
      await syncRunRepo.update(syncRun!.id, {
        status: "SUCCESS",
        finishedAt: new Date(),
        productsFetched: totalProducts,
        ordersFetched: totalOrders,
      });

      return {
        syncRunId: syncRun!.id,
        providersProcessed: succeeded.length,
        productsFetched: totalProducts,
        ordersFetched: totalOrders,
        syncedAt: syncedAt.toISOString(),
      };
    } catch (error) {
      // Update SyncRun with FAILED status on unexpected error
      await syncRunRepo.update(syncRun!.id, {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

// Register hourly schedule
schedules.create({
  cron: "0 * * * *", // Every hour at minute 0
  task: syncEcommerceSnapshot.id,
  deduplicationKey: "hourly-sync",
});
