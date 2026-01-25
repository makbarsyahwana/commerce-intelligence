import { container, SERVICE_TOKENS } from "./DIContainer";
import { SyncService } from "../services/SyncService";
import { ProductRepository } from "../repositories/ProductRepository";
import { OrderRepository } from "../repositories/OrderRepository";
import { SyncRunRepository } from "../repositories/SyncRunRepository";

// Auto-configure container on first import
let configured = false;
if (!configured) {
  // Register repositories (singletons)
  container.register(SERVICE_TOKENS.PRODUCT_REPOSITORY, () => new ProductRepository(), {
    singleton: true,
  });

  container.register(SERVICE_TOKENS.ORDER_REPOSITORY, () => new OrderRepository(), {
    singleton: true,
  });

  container.register(SERVICE_TOKENS.SYNC_RUN_REPOSITORY, () => new SyncRunRepository(), {
    singleton: true,
  });

  // Register services (singletons)
  container.register(SERVICE_TOKENS.SYNC_SERVICE, () => new SyncService(), {
    singleton: true,
  });
  
  configured = true;
}

export function configureContainer(): void {
  // No-op - container is auto-configured on import
}

// Factory functions for easy access
export function getSyncService(): SyncService {
  return container.resolve<SyncService>(SERVICE_TOKENS.SYNC_SERVICE);
}

export function getProductRepository(): ProductRepository {
  return container.resolve<ProductRepository>(SERVICE_TOKENS.PRODUCT_REPOSITORY);
}

export function getOrderRepository(): OrderRepository {
  return container.resolve<OrderRepository>(SERVICE_TOKENS.ORDER_REPOSITORY);
}

export function getSyncRunRepository(): SyncRunRepository {
  return container.resolve<SyncRunRepository>(SERVICE_TOKENS.SYNC_RUN_REPOSITORY);
}
