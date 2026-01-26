// Dashboard Domain Types

export interface MetricCard {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

export interface OrderStatus {
  status: string;
  count: number;
  totalRevenue: number;
}

export interface ProductCategory {
  category: string;
  count: number;
  avgPrice: number;
  totalValue: number;
}

export interface RevenueCategory {
  category: string;
  totalRevenue: number;
  unitsSold: number;
}

export interface RecentOrder {
  id: string;
  providerOrderId: string;
  provider: string;
  status: string;
  totalPrice: number;
  createdAt: Date;
  _count: {
    orderItems: number;
  };
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  totalRevenue: number;
  price: number;
  category: string;
}

export interface SyncRun {
  id: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  startedAt: Date;
  finishedAt?: Date | null;
  startTime?: Date;
  endTime?: Date;
  provider?: string | null;
  productsFetched?: number | null;
  ordersFetched?: number | null;
  errorMessage?: string | null;
}

// Chart Data Types
export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface PieChartData extends ChartData {
  fill?: string;
}

export interface BarChartData extends ChartData {
  fill?: string;
}
