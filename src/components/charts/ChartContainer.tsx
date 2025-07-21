
import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactElement;
  height?: number;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  children,
  height = 400,
  className = ""
}) => {
  return (
    <Card className={`p-6 shadow-card border-border ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ChartContainer;
