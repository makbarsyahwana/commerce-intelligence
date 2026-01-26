import { getRecentOrders } from '@/lib/services/dashboardQueries';
import DataTable from '@/components/ui/molecules/DataTable';
import Badge from '@/components/ui/atoms/Badge';
import type { RecentOrder } from '@/types/dashboard';
import type { Column } from '@/components/ui/molecules/DataTable';

interface RecentOrdersTableProps {
  limit?: number;
}

export default async function RecentOrdersTable({ limit = 5 }: RecentOrdersTableProps) {
  const recentOrders: RecentOrder[] = await getRecentOrders(limit);

  const columns: Column<RecentOrder>[] = [
    {
      key: 'providerOrderId' as keyof RecentOrder,
      header: 'Order ID',
      className: 'font-medium text-gray-900'
    },
    {
      key: 'provider' as keyof RecentOrder,
      header: 'Provider',
      render: (_value, row) => (
        <span className="text-gray-500">{row.provider}</span>
      )
    },
    {
      key: 'status' as keyof RecentOrder,
      header: 'Status',
      render: (_value, row) => (
        <Badge variant={
          row.status === 'completed' ? 'success' :
          row.status === 'pending' ? 'warning' :
          row.status === 'cancelled' ? 'error' : 'default'
        }>
          {row.status}
        </Badge>
      )
    },
    {
      key: '_count' as keyof RecentOrder,
      header: 'Items',
      render: (_value, row) => row._count.orderItems
    },
    {
      key: 'totalPrice' as keyof RecentOrder,
      header: 'Total',
      render: (_value, row) => (
        <span className="font-medium text-gray-900">
          ${Number(row.totalPrice).toLocaleString()}
        </span>
      )
    },
    {
      key: 'createdAt' as keyof RecentOrder,
      header: 'Date',
      render: (_value, row) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
      <DataTable
        data={recentOrders}
        columns={columns}
        emptyMessage="No orders found"
        emptyIcon={
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
    </div>
  );
}
