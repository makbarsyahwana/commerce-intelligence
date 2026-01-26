import { HTMLAttributes } from 'react';

export interface AnimatedGradientProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'aurora' | 'sunset' | 'ocean' | 'cosmic' | 'neon';
  intensity?: 'subtle' | 'medium' | 'bold';
}

export default function AnimatedGradient({ 
  variant = 'aurora', 
  intensity = 'medium', 
  className = '', 
  ...props 
}: AnimatedGradientProps) {
  const gradients = {
    aurora: {
      subtle: 'bg-gradient-to-br from-purple-400/20 via-pink-300/20 to-blue-400/20',
      medium: 'bg-gradient-to-br from-purple-500/30 via-pink-400/30 to-blue-500/30',
      bold: 'bg-gradient-to-br from-purple-600/40 via-pink-500/40 to-blue-600/40'
    },
    sunset: {
      subtle: 'bg-gradient-to-tr from-orange-400/20 via-red-300/20 to-pink-400/20',
      medium: 'bg-gradient-to-tr from-orange-500/30 via-red-400/30 to-pink-500/30',
      bold: 'bg-gradient-to-tr from-orange-600/40 via-red-500/40 to-pink-600/40'
    },
    ocean: {
      subtle: 'bg-gradient-to-bl from-blue-400/20 via-cyan-300/20 to-teal-400/20',
      medium: 'bg-gradient-to-bl from-blue-500/30 via-cyan-400/30 to-teal-500/30',
      bold: 'bg-gradient-to-bl from-blue-600/40 via-cyan-500/40 to-teal-600/40'
    },
    cosmic: {
      subtle: 'bg-gradient-to-r from-indigo-400/20 via-purple-300/20 to-pink-400/20',
      medium: 'bg-gradient-to-r from-indigo-500/30 via-purple-400/30 to-pink-500/30',
      bold: 'bg-gradient-to-r from-indigo-600/40 via-purple-500/40 to-pink-600/40'
    },
    neon: {
      subtle: 'bg-gradient-to-r from-cyan-400/20 via-green-300/20 to-blue-400/20',
      medium: 'bg-gradient-to-r from-cyan-500/30 via-green-400/30 to-blue-500/30',
      bold: 'bg-gradient-to-r from-cyan-600/40 via-green-500/40 to-blue-600/40'
    }
  };

  const animations = {
    aurora: 'animate-pulse',
    sunset: 'animate-gradient-x',
    ocean: 'animate-gradient-y',
    cosmic: 'animate-gradient-xy',
    neon: 'animate-pulse'
  };

  return (
    <div 
      className={`
        absolute inset-0 
        ${gradients[variant][intensity]} 
        ${animations[variant]}
        ${className}
      `}
      {...props}
    />
  );
}
