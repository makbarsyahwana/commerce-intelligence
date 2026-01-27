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

export interface TrendInfo {
  value: number;
  direction: 'up' | 'down' | 'neutral';
}

export interface DashboardTrends {
  products: TrendInfo;
  orders: TrendInfo;
  revenue: TrendInfo;
  providers: TrendInfo;
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
  orderCount: number;
  quantity: number;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalProviders: number;
  trends: DashboardTrends;
  latestSyncRun: SyncRun | null;
  dateRange: { from: Date; to: Date } | null;
  [key: string]: unknown;
}

export interface DashboardDataBundle {
  metrics: DashboardMetrics;
  ordersByStatus: OrderStatus[];
  productsByCategory: ProductCategory[];
  revenueByCategory: RevenueCategory[];
}

export type DashboardChartData = Omit<DashboardDataBundle, 'metrics'>;

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
  provider: string;
  price: number;
  category: string;
  availability: boolean;
  rating: number | null;
  discount: number | null;
  orderCount: number;
  totalQuantity: number;
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
  [key: string]: unknown;
}

export interface PieChartData extends ChartData {
  fill?: string;
}

export interface BarChartData extends ChartData {
  fill?: string;
}
