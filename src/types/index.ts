// Dashboard Types
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

// API Types
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
  lastSync: SyncRun | null;
  isRunning: boolean;
}

// Component Props Types
export interface TableColumn<T> {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
}

// UI Component Types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
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

// Form Types
export interface SyncFormData {
  provider?: string;
  force?: boolean;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}
