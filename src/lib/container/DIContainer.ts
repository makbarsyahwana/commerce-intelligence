export class DIContainer {
  private services = new Map<string, { factory: () => unknown; singleton: boolean }>();
  private singletons = new Map<string, unknown>();

  register<T>(token: string, factory: () => T, options: { singleton?: boolean } = {}): void {
    this.services.set(token, { factory, singleton: options.singleton || false });
  }

  resolve<T>(token: string): T {
    const service = this.services.get(token);
    if (!service) {
      throw new Error(`Service '${token}' not registered`);
    }

    if (service.singleton) {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, service.factory());
      }
      return this.singletons.get(token) as T;
    }

    return service.factory() as T;
  }

  has(token: string): boolean {
    return this.services.has(token);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}

// Global container instance
export const container = new DIContainer();

// Service tokens
export const SERVICE_TOKENS = {
  SYNC_SERVICE: 'SyncService',
  PRODUCT_REPOSITORY: 'ProductRepository',
  ORDER_REPOSITORY: 'OrderRepository',
  SYNC_RUN_REPOSITORY: 'SyncRunRepository',
} as const;
