
import React from 'react';
import { Button } from '@/components/ui/button';

interface TimeRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  className?: string;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ 
  selectedRange, 
  onRangeChange, 
  className = "" 
}) => {
  const ranges = [
    { label: '7D', value: '7', days: 7 },
    { label: '30D', value: '30', days: 30 },
    { label: '60D', value: '60', days: 60 },
    { label: '90D', value: '90', days: 90 },
    { label: 'All', value: 'all', days: null }
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={selectedRange === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onRangeChange(range.value)}
          className={selectedRange === range.value ? "bg-gradient-primary" : ""}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
