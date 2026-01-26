'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OrderStatusData {
  status: string;
  count: number;
  totalRevenue: number;
}

interface OrdersByStatusChartProps {
  data: OrderStatusData[];
}

const COLORS = {
  completed: '#10b981', // green
  pending: '#f59e0b',   // yellow
  cancelled: '#ef4444',  // red
  processing: '#3b82f6', // blue
  shipped: '#8b5cf6',    // purple
};

export default function OrdersByStatusChart({ data }: OrdersByStatusChartProps) {
  const chartData = data.map(item => ({
    ...item,
    displayName: item.status.charAt(0).toUpperCase() + item.status.slice(1),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.displayName}</p>
          <p className="text-sm text-gray-600">Orders: {data.count}</p>
          <p className="text-sm text-gray-600">Revenue: ${Number(data.totalRevenue).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h2>
      
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No order data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayName" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.status as keyof typeof COLORS] || '#6b7280'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {chartData.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[item.status as keyof typeof COLORS] || '#6b7280' }}
            />
            <span className="text-xs text-gray-600">{item.displayName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
