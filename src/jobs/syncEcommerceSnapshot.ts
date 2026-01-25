import { task, schedules } from "@trigger.dev/sdk";
import { syncAllProviders } from "../lib/sync/syncProviders";
import { createLogger } from "../lib/logger";

export const syncEcommerceSnapshot = task({
  id: "sync-ecommerce-snapshot",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async () => {
    const logger = createLogger({ operation: 'syncEcommerceSnapshot' });
    
    logger.info("Starting e-commerce multi-provider snapshot sync");

    try {
      await syncAllProviders();
      
      logger.info("Multi-provider sync completed successfully");
      
    } catch (error) {
      logger.error("Multi-provider sync failed", { 
        error: error instanceof Error ? error.message : "Unknown error" 
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
