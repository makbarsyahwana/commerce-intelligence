import { task, schedules } from "@trigger.dev/sdk";
import { z } from "zod";

export const syncEcommerceSnapshot = task({
  id: "sync-ecommerce-snapshot",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async () => {
    console.log("Starting e-commerce snapshot sync");

    // Placeholder: Create SyncRun
    const syncRun = await createSyncRun();
    console.log(`Created SyncRun: ${syncRun.id}`);

    try {
      // Placeholder: Fetch products
      const products = await fetchProducts();
      console.log(`Fetched ${products.length} products`);

      // Placeholder: Upsert products
      await upsertProducts(products);
      console.log("Upserted products");

      // Placeholder: Fetch orders
      const orders = await fetchOrders();
      console.log(`Fetched ${orders.length} orders`);

      // Placeholder: Upsert orders
      await upsertOrders(orders);
      console.log("Upserted orders");

      // Placeholder: Reconcile order items
      await reconcileOrderItems(orders);
      console.log("Reconciled order items");

      // Placeholder: Update SyncRun as SUCCESS
      await updateSyncRun(syncRun.id, "SUCCESS", null, products.length, orders.length);
      console.log("Sync completed successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      // Placeholder: Update SyncRun as FAILED
      await updateSyncRun(syncRun.id, "FAILED", error instanceof Error ? error.message : "Unknown error", null, null);
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

// Placeholder functions (to be implemented)
async function createSyncRun() {
  // TODO: Implement SyncRun creation
  return { id: "placeholder-sync-run-id" } as any;
}

async function fetchProducts() {
  // TODO: Implement fetch from https://fake-store-api.mock.beeceptor.com/api/products
  return [];
}

async function fetchOrders() {
  // TODO: Implement fetch from https://fake-store-api.mock.beeceptor.com/api/orders
  return [];
}

async function upsertProducts(products: any[]) {
  // TODO: Implement Prisma upsert by providerProductId
}

async function upsertOrders(orders: any[]) {
  // TODO: Implement Prisma upsert by providerOrderId
}

async function reconcileOrderItems(orders: any[]) {
  // TODO: Implement delete+create per order
}

async function updateSyncRun(
  id: string,
  status: "RUNNING" | "SUCCESS" | "FAILED",
  errorMessage: string | null,
  productsFetched: number | null,
  ordersFetched: number | null
) {
  // TODO: Implement SyncRun update
}
