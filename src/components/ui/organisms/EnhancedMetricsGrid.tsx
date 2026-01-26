import EnhancedMetricCard from '../atoms/EnhancedMetricCard';

export interface Metric {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
}

interface EnhancedMetricsGridProps {
  metrics: Metric[];
  loading?: boolean;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
  staggered?: boolean;
  className?: string;
}

export default function EnhancedMetricsGrid({ 
  metrics, 
  loading = false, 
  variant = 'glass',
  staggered = true,
  className = '' 
}: EnhancedMetricsGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={staggered ? `animate-fade-in-up` : ''}
          style={staggered ? { animationDelay: `${index * 100}ms` } : {}}
        >
          <EnhancedMetricCard
            title={metric.title}
            value={metric.value}
            trend={metric.trend}
            icon={metric.icon}
            loading={loading}
            variant={variant}
            animated={true}
          />
        </div>
      ))}
    </div>
  );
}
