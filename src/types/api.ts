// API Domain Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  timestamp: string;
}

export interface SyncStatusResponse {
  lastSync: import('./dashboard').SyncRun | null;
  isRunning: boolean;
}

// Provider API Types
export interface ProductResponse {
  product_id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  discount: number;
  availability: boolean;
  brand: string;
  category: string;
  rating: number;
  reviews?: Array<{
    user_id: number;
    rating: number;
    comment: string;
  }>;
}

export interface OrderResponse {
  order_id: number;
  user_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
  total_price: number;
  status: string;
}
