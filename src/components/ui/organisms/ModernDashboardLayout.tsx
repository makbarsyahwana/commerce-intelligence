import { ReactNode } from 'react';
import GlassCard from '../atoms/GlassCard';
import AnimatedGradient from '../atoms/AnimatedGradient';
import FloatingButton from '../atoms/FloatingButton';

interface ModernDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  backgroundVariant?: 'aurora' | 'sunset' | 'ocean' | 'cosmic' | 'neon';
  glassVariant?: 'default' | 'frosted' | 'crystal' | 'neon';
}

export default function ModernDashboardLayout({ 
  children, 
  title, 
  subtitle, 
  actions,
  backgroundVariant = 'aurora',
  glassVariant = 'frosted'
}: ModernDashboardLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedGradient variant={backgroundVariant} intensity="medium" />
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          {(title || subtitle || actions) && (
            <div className="mb-8">
              <GlassCard variant={glassVariant} blur="lg" className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    {title && (
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {title}
                      </h1>
                    )}
                    {subtitle && (
                      <p className="text-gray-600 dark:text-gray-300">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {actions && (
                    <div className="flex items-center space-x-4">
                      {actions}
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          )}
          
          {/* Dashboard Content */}
          <div className="space-y-8">
            {children}
          </div>
        </div>
      </div>
      
      {/* Floating Action Button */}
      <FloatingButton position="bottom-right" variant="primary" pulse>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </FloatingButton>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );
}
