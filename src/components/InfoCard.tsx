
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

interface InfoCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  value,
  change,
  trend,
  className = ""
}) => {
  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={`p-4 shadow-card border-border ${className}`}>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className={`text-sm font-medium ${getTrendColor(trend)}`}>
            {change}
          </div>
        )}
      </div>
    </Card>
  );
};

export default InfoCard;
