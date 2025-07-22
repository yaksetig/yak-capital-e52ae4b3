
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({ 
  children, 
  className = "" 
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`
      ${isMobile ? 'px-2 py-4 space-y-4' : 'px-6 py-6 space-y-6'}
      ${className}
    `}>
      {children}
    </div>
  );
};
