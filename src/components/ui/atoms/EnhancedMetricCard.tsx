import { HTMLAttributes, forwardRef, useState } from 'react';

export interface EnhancedMetricCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
  animated?: boolean;
}

const EnhancedMetricCard = forwardRef<HTMLDivElement, EnhancedMetricCardProps>(
  ({ 
    className = '', 
    title, 
    value, 
    trend, 
    icon, 
    loading = false, 
    variant = 'default',
    animated = true,
    ...props 
  }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    const baseStyles = 'relative overflow-hidden transition-all duration-300 rounded-2xl';
    
    const variants = {
      default: 'bg-white shadow-lg hover:shadow-xl',
      glass: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl hover:bg-white/20',
      neon: 'bg-black/20 backdrop-blur-md border border-cyan-500/30 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40',
      gradient: 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl'
    };

    const classes = `
      ${baseStyles} 
      ${variants[variant]} 
      ${animated ? 'transform hover:scale-105' : ''} 
      ${className}
    `.trim();

    if (loading) {
      return (
        <div className={`${classes} p-6`} ref={ref} {...props}>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      );
    }

    return (
      <div 
        className={classes} 
        ref={ref} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Animated background effect */}
        {variant === 'gradient' && animated && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
        )}
        
        {/* Neon glow effect */}
        {variant === 'neon' && isHovered && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl"></div>
        )}
        
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
            {icon && (
              <div className={`transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                {icon}
              </div>
            )}
          </div>
          
          <div className="flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {trend && (
              <div className={`ml-3 flex items-center text-sm font-medium transition-all duration-300 ${
                trend.direction === 'up' ? 'text-green-600' : 
                trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
              }`}>
                {trend.direction === 'up' && (
                  <svg className="w-4 h-4 mr-1 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trend.direction === 'down' && (
                  <svg className="w-4 h-4 mr-1 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trend.value}%
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EnhancedMetricCard.displayName = 'EnhancedMetricCard';

export default EnhancedMetricCard;
