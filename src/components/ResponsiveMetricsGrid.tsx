
import React from 'react';
import { InfoCard } from './InfoCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface MetricData {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ResponsiveMetricsGridProps {
  metrics: MetricData[];
}

export const ResponsiveMetricsGrid: React.FC<ResponsiveMetricsGridProps> = ({ metrics }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`
      grid gap-3
      ${isMobile 
        ? 'grid-cols-1 sm:grid-cols-2' 
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
      }
    `}>
      {metrics.map((metric, index) => (
        <InfoCard
          key={index}
          title={metric.title}
          value={metric.value}
          change={metric.change}
          trend={metric.trend}
          className={isMobile ? 'min-h-[80px]' : ''}
        />
      ))}
    </div>
  );
};
