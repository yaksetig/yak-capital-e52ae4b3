
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings, ChevronDown, Eye, ZoomIn, ZoomOut } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileChartControlsProps {
  // Essential mobile controls
  chartHeight: number;
  onChartHeightChange: (height: number) => void;
  visibleLines: Record<string, boolean>;
  onLineVisibilityChange: (line: string, visible: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const MobileChartControls: React.FC<MobileChartControlsProps> = ({
  chartHeight,
  onChartHeightChange,
  visibleLines,
  onLineVisibilityChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const essentialLines = [
    { key: 'sma20', label: 'SMA 20' },
    { key: 'sma50', label: 'SMA 50' },
    { key: 'sma200', label: 'SMA 200' },
    { key: 'ema20', label: 'EMA 20' },
  ];

  if (!isMobile) {
    return null; // Use regular ChartControls for desktop
  }

  return (
    <Card className="p-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-2">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Chart Settings</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Quick Actions */}
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={onZoomIn} className="min-h-[44px]">
              <ZoomIn className="w-4 h-4 mr-1" />
              Zoom In
            </Button>
            <Button size="sm" variant="outline" onClick={onZoomOut} className="min-h-[44px]">
              <ZoomOut className="w-4 h-4 mr-1" />
              Zoom Out
            </Button>
            <Button size="sm" variant="outline" onClick={onResetZoom} className="min-h-[44px]">
              Reset
            </Button>
          </div>

          {/* Chart Height */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chart Size:</label>
            <Select value={chartHeight?.toString() || "300"} onValueChange={(value) => onChartHeightChange(Number(value))}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="250">Small</SelectItem>
                <SelectItem value="300">Medium</SelectItem>
                <SelectItem value="350">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Essential Indicators */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <label className="text-sm font-medium">Key Indicators:</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {essentialLines.map((line) => (
                <div key={line.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={line.key}
                    checked={visibleLines[line.key] ?? true}
                    onCheckedChange={(checked) => onLineVisibilityChange(line.key, checked as boolean)}
                  />
                  <label htmlFor={line.key} className="text-sm">
                    {line.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
