
import React from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileTimeRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  className?: string;
}

export const MobileTimeRangeSelector: React.FC<MobileTimeRangeSelectorProps> = ({ 
  selectedRange, 
  onRangeChange, 
  className = "" 
}) => {
  const isMobile = useIsMobile();
  
  const ranges = [
    { label: '7D', value: '7', days: 7 },
    { label: '30D', value: '30', days: 30 },
    { label: '60D', value: '60', days: 60 },
    { label: '90D', value: '90', days: 90 },
    { label: 'All', value: 'all', days: null }
  ];

  return (
    <div className={`
      flex gap-2 
      ${isMobile ? 'flex-wrap justify-center' : ''} 
      ${className}
    `}>
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={selectedRange === range.value ? "default" : "outline"}
          size={isMobile ? "sm" : "sm"}
          onClick={() => onRangeChange(range.value)}
          className={`
            ${selectedRange === range.value ? "bg-gradient-primary" : ""}
            ${isMobile ? "min-h-[44px] min-w-[60px]" : ""}
          `}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
};
