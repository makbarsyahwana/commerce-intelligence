import MetricCard from '../atoms/MetricCard';

export interface Metric {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

export interface MetricsGridProps {
  metrics: Metric[];
  loading?: boolean;
  className?: string;
}

export default function MetricsGrid({ metrics, loading = false, className = '' }: MetricsGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          trend={metric.trend}
          icon={metric.icon}
          loading={loading}
        />
      ))}
    </div>
  );
}
