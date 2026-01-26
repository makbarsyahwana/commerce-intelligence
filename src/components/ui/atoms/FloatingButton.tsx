import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface FloatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  pulse?: boolean;
}

const FloatingButton = forwardRef<HTMLButtonElement, FloatingButtonProps>(
  ({ 
    className = '', 
    position = 'bottom-right', 
    size = 'md', 
    variant = 'primary',
    pulse = false,
    children, 
    ...props 
  }, ref) => {
    
    const positions = {
      'bottom-right': 'fixed bottom-8 right-8',
      'bottom-left': 'fixed bottom-8 left-8',
      'top-right': 'fixed top-8 right-8',
      'top-left': 'fixed top-8 left-8'
    };

    const sizes = {
      sm: 'w-12 h-12',
      md: 'w-14 h-14',
      lg: 'w-16 h-16'
    };

    const variants = {
      primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40',
      secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg shadow-gray-500/25 hover:shadow-xl hover:shadow-gray-500/40',
      accent: 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/40'
    };

    const classes = `
      ${positions[position]} 
      ${sizes[size]} 
      ${variants[variant]} 
      rounded-full 
      flex 
      items-center 
      justify-center 
      transition-all 
      duration-300 
      hover:scale-110 
      active:scale-95
      ${pulse ? 'animate-pulse' : ''}
      ${className}
    `.trim();

    return (
      <button className={classes} ref={ref} {...props}>
        <span className="flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  }
);

FloatingButton.displayName = 'FloatingButton';

export default FloatingButton;
