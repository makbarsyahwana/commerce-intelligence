// Providers Domain Types

export interface ProviderConfig {
  name: string;
  productsApi: string;
  ordersApi: string;
  auth?: string;
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
  variations?: {
    price: number;
    discount: number;
    rating: number;
    totalPrice: number;
    quantity: boolean;
    unitPrice: number;
  };
}

export interface ProviderSyncStatus {
  provider: string;
  lastSync: Date | null;
  status: 'success' | 'failed' | 'running';
  errorMessage?: string;
  productsCount?: number;
  ordersCount?: number;
}

export interface ProviderSyncResult {
  provider: string;
  success: boolean;
  productsFetched: number;
  ordersFetched: number;
  error?: string;
  duration: number;
}

// Rate Limiting Types
export interface RateLimitEntry {
  count: number;
  resetTime: number;
}
