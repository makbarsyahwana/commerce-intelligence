'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { RevenueCategory } from '@/types/dashboard';
import type { RechartsTooltipProps } from '@/types/charts';

interface RevenueByCategoryChartProps {
  data: RevenueCategory[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

type RevenueCategoryChartDatum = RevenueCategory & {
  displayName: string;
  avgOrderValue: number;
};

export default function RevenueByCategoryChart({ data }: RevenueByCategoryChartProps) {
  const chartData: RevenueCategoryChartDatum[] = data.map((item) => ({
    ...item,
    displayName: item.category === 'Uncategorized' ? 'Other' : item.category,
    avgOrderValue: item.orderCount > 0 ? Math.round(item.quantity / item.orderCount) : 0,
  }));

  const CustomTooltip = ({ active, payload }: RechartsTooltipProps<RevenueCategoryChartDatum>) => {
    if (active && payload && payload.length) {
      const tooltipData = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{tooltipData.displayName}</p>
          <p className="text-sm text-gray-600">Orders: {tooltipData.orderCount}</p>
          <p className="text-sm text-gray-600">Units Sold: {tooltipData.quantity.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Avg Units/Order: {tooltipData.avgOrderValue}</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <p>No revenue data available</p>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="horizontal"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            type="category"
            dataKey="displayName" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="quantity" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total Orders</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + item.orderCount, 0)}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Total Units</p>
          <p className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Categories</p>
          <p className="text-lg font-semibold text-gray-900">{data.length}</p>
        </div>
      </div>
    </div>
  );
}
