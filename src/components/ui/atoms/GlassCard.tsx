import { HTMLAttributes, forwardRef } from 'react';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'frosted' | 'crystal' | 'neon';
  blur?: 'sm' | 'md' | 'lg';
  border?: boolean;
  glow?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className = '', variant = 'default', blur = 'md', border = true, glow = false, children, ...props }, ref) => {
    const baseStyles = 'relative rounded-2xl transition-all duration-300';
    
    const variants = {
      default: 'bg-white/10 backdrop-blur-md',
      frosted: 'bg-white/20 backdrop-blur-lg',
      crystal: 'bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl',
      neon: 'bg-black/20 backdrop-blur-md border border-cyan-500/30'
    };

    const blurs = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg'
    };

    const borders = {
      default: 'border border-white/20',
      frosted: 'border border-white/30',
      crystal: 'border border-white/40',
      neon: 'border border-cyan-500/50'
    };

    const glows = {
      default: '',
      frosted: '',
      crystal: 'shadow-xl shadow-white/10',
      neon: 'shadow-lg shadow-cyan-500/20'
    };

    const classes = `
      ${baseStyles} 
      ${variants[variant]} 
      ${blurs[blur]} 
      ${border ? borders[variant] : ''} 
      ${glow ? glows[variant] : ''} 
      ${className}
    `.trim();

    return (
      <div className={classes} ref={ref} {...props}>
        {children}
        {glow && variant === 'neon' && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl -z-10"></div>
        )}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
