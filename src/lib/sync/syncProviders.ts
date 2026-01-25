import { getAllProviders, ProviderConfig } from "../providers/config";
import { fetchProducts, fetchOrders } from "./fetchProviders";
import { reconcileOrderItems } from "./reconcileOrderItems";
import { createLogger } from "../../lib/logger";
import { getSyncService } from "../container/config";

interface ProviderSyncResult {
  provider: string;
  success: boolean;
  productsFetched: number;
  ordersFetched: number;
  error?: string;
  duration: number;
}

export async function syncAllProviders(): Promise<void> {
  const logger = createLogger({ operation: 'syncAllProviders' });
  const providers = getAllProviders();
  
  logger.info(`Starting sync for ${providers.length} providers`, { 
    providers: providers.map(p => p.name) 
  });

  // Get sync service from container (auto-configured on import)
  const syncService = getSyncService();

  // Create a master sync run for tracking overall progress
  const masterSyncRun = await syncService.createSyncRun();

  const results: ProviderSyncResult[] = [];

  try {
    // Sync each provider sequentially for rate limiting
    for (const provider of providers) {
      const result = await syncSingleProvider(provider, masterSyncRun.id);
      results.push(result);
      
      // Log provider result
      if (result.success) {
        logger.info(`Provider sync completed`, {
          provider: result.provider,
          productsFetched: result.productsFetched,
          ordersFetched: result.ordersFetched,
          duration: result.duration,
        });
      } else {
        logger.error(`Provider sync failed`, {
          provider: result.provider,
          error: result.error,
          duration: result.duration,
        });
      }
    }

    // Update master sync run with aggregated results
    const totalProducts = results.reduce((sum, r) => sum + r.productsFetched, 0);
    const totalOrders = results.reduce((sum, r) => sum + r.ordersFetched, 0);
    const failedProviders = results.filter(r => !r.success);
    
    await syncService.updateSyncRun(masterSyncRun.id, {
      success: failedProviders.length === 0,
      productsProcessed: totalProducts,
      ordersProcessed: totalOrders,
      error: failedProviders.length > 0 ? 
        failedProviders.map(p => `${p.provider}: ${p.error}`).join('; ') : 
        undefined,
      duration: results.reduce((sum, r) => sum + r.duration, 0),
    });

    logger.info(`All providers sync completed`, {
      totalProviders: providers.length,
      successfulProviders: results.filter(r => r.success).length,
      failedProviders: failedProviders.length,
      totalProducts,
      totalOrders,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('All providers sync failed', { error: errorMessage });
    
    // Mark master sync run as failed
    await syncService.updateSyncRun(masterSyncRun.id, {
      success: false,
      productsProcessed: 0,
      ordersProcessed: 0,
      error: errorMessage,
      duration: 0,
    });
    
    throw error;
  }
}

async function syncSingleProvider(
  provider: ProviderConfig, 
  masterSyncRunId: string
): Promise<ProviderSyncResult> {
  const startTime = Date.now();
  const logger = createLogger({ 
    operation: 'syncSingleProvider', 
    provider: provider.name,
    masterRunId: masterSyncRunId,
  });

  // Get sync service
  const syncService = getSyncService();

  // Create provider-specific sync run
  const providerSyncRun = await syncService.createSyncRun(provider.name);

  try {
    // Fetch products
    const products = await fetchProducts(provider);
    logger.debug(`Fetched products`, { count: products.length });

    // Fetch orders
    const orders = await fetchOrders(provider);
    logger.debug(`Fetched orders`, { count: orders.length });

    // Use service layer to sync data
    const syncResult = await syncService.syncProvider(provider, products, orders);

    // Reconcile order items (still uses existing implementation)
    await reconcileOrderItems(orders, provider);
    logger.debug(`Reconciled order items`, { count: orders.length });

    // Update provider sync run
    await syncService.updateSyncRun(providerSyncRun.id, syncResult);

    return {
      provider: provider.name,
      success: syncResult.success,
      productsFetched: syncResult.productsProcessed,
      ordersFetched: syncResult.ordersProcessed,
      error: syncResult.error,
      duration: syncResult.duration,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Provider sync failed`, { error: errorMessage });

    // Mark provider sync as failed
    await syncService.updateSyncRun(providerSyncRun.id, {
      success: false,
      productsProcessed: 0,
      ordersProcessed: 0,
      error: errorMessage,
      duration: Date.now() - startTime,
    });

    return {
      provider: provider.name,
      success: false,
      productsFetched: 0,
      ordersFetched: 0,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}
