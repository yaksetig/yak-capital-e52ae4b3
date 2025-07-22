
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileChartContainerProps {
  title: string;
  children: React.ReactNode;
  controls?: React.ReactNode;
  defaultCollapsed?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export const MobileChartContainer: React.FC<MobileChartContainerProps> = ({
  title,
  children,
  controls,
  defaultCollapsed = false,
  priority = 'medium'
}) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile && defaultCollapsed);

  if (!isMobile) {
    return (
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          {controls}
        </div>
        {children}
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>
      
      {!isCollapsed && (
        <div className="space-y-3">
          {controls && (
            <div className="border-b pb-3">
              {controls}
            </div>
          )}
          <div style={{ height: priority === 'high' ? '300px' : '250px' }}>
            {children}
          </div>
        </div>
      )}
    </Card>
  );
};
