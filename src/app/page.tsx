import { getMetricCards, getOrdersByStatus, getProductsByCategory, getRecentOrders, getTopProducts, getRevenueByCategory } from '@/lib/services/dashboardQueries';
import { Metadata } from 'next';
import { 
  RecentOrdersTable, 
  TopProductsTable, 
  OrdersByStatusChart, 
  ProductsByCategoryChart, 
  RevenueByCategoryChart, 
  SyncStatus 
} from '@/components';
import ModernDashboardLayout from '@/components/ui/organisms/ModernDashboardLayout';
import EnhancedMetricsGrid from '@/components/ui/organisms/EnhancedMetricsGrid';
import GlassCard from '@/components/ui/atoms/GlassCard';
import type { DashboardChartData, DashboardDataBundle, DashboardMetrics, MetricCard } from '@/types/dashboard';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard',
    description: 'Comprehensive e-commerce analytics with real-time metrics, order tracking, and sync monitoring.',
    openGraph: {
      title: 'E-commerce Analytics Dashboard',
      description: 'Real-time insights into your e-commerce operations',
      url: '/',
    },
  };
}

const DASHBOARD_TITLE = 'E-commerce Analytics Dashboard';
const DASHBOARD_SUBTITLE = 'Real-time insights into your e-commerce operations';

function createMetricData(metrics: DashboardMetrics): MetricCard[] {
  return [
    {
      title: 'Total Products',
      value: metrics.totalProducts.toLocaleString(),
      icon: getProductIcon(),
      trend: { value: 12, direction: 'up' as const }
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toLocaleString(),
      icon: getOrderIcon(),
      trend: { value: 8, direction: 'up' as const }
    },
    {
      title: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      icon: getRevenueIcon(),
      trend: { value: 23, direction: 'up' as const }
    },
    {
      title: 'Providers',
      value: metrics.totalProviders,
      icon: getProviderIcon(),
      trend: { value: 0, direction: 'neutral' as const }
    }
  ];
}

function getProductIcon() {
  return (
    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function getOrderIcon() {
  return (
    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function getRevenueIcon() {
  return (
    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );
}

function getProviderIcon() {
  return (
    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

export default async function Dashboard() {
  const dashboardData = await fetchDashboardData();
  const chartData = prepareChartData(dashboardData);
  const metrics = createMetricData(dashboardData.metrics);

  return (
    <ModernDashboardLayout 
      title={DASHBOARD_TITLE}
      subtitle={DASHBOARD_SUBTITLE}
      backgroundVariant="aurora"
      glassVariant="frosted"
    >
      <DashboardSections 
        metrics={metrics}
        chartData={chartData}
      />
    </ModernDashboardLayout>
  );
}

async function fetchDashboardData(): Promise<DashboardDataBundle> {
  const [metrics, ordersByStatus, productsByCategory, revenueByCategory] = await Promise.all([
    getMetricCards(),
    getOrdersByStatus(),
    getProductsByCategory(),
    getRevenueByCategory()
  ]);

  return { metrics, ordersByStatus, productsByCategory, revenueByCategory };
}

function prepareChartData(data: DashboardDataBundle): DashboardChartData {
  return {
    ordersByStatus: data.ordersByStatus,
    productsByCategory: data.productsByCategory,
    revenueByCategory: data.revenueByCategory,
  };
}

interface DashboardSectionsProps {
  metrics: MetricCard[];
  chartData: DashboardChartData;
}

function DashboardSections({ metrics, chartData }: DashboardSectionsProps) {
  return (
    <>
      <EnhancedMetricsGrid variant="glass" metrics={metrics} />
      <ChartsSection chartData={chartData} />
      <TablesSection />
      <SyncStatusSection />
    </>
  );
}

function ChartsSection({ chartData }: { chartData: DashboardChartData }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard variant="frosted" blur="lg" className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h2>
          <OrdersByStatusChart data={chartData.ordersByStatus} />
        </GlassCard>
        
        <GlassCard variant="frosted" blur="lg" className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Products by Category</h2>
          <ProductsByCategoryChart data={chartData.productsByCategory} />
        </GlassCard>
      </div>

      <GlassCard variant="frosted" blur="lg" className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Category</h2>
        <RevenueByCategoryChart data={chartData.revenueByCategory} />
      </GlassCard>
    </>
  );
}

function TablesSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlassCard variant="frosted" blur="lg" className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
        <RecentOrdersTable limit={5} />
      </GlassCard>
      
      <GlassCard variant="frosted" blur="lg" className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h2>
        <TopProductsTable limit={5} />
      </GlassCard>
    </div>
  );
}

function SyncStatusSection() {
  return (
    <GlassCard variant="frosted" blur="lg" className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sync Status</h2>
      <SyncStatus />
    </GlassCard>
  );
}
