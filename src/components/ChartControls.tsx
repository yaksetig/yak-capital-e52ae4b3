import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Eye, EyeOff } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ChartControlsProps {
  // Y-axis controls
  yAxisPadding: number;
  onYAxisPaddingChange: (padding: number) => void;
  autoFit: boolean;
  onAutoFitChange: (autoFit: boolean) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceRangeChange: (min: number, max: number) => void;
  
  // Chart height
  chartHeight: number;
  onChartHeightChange: (height: number) => void;
  
  // Line visibility
  visibleLines: Record<string, boolean>;
  onLineVisibilityChange: (line: string, visible: boolean) => void;
  
  // Cycle analysis
  showCycleAnalysis: boolean;
  onCycleAnalysisChange: (show: boolean) => void;
  
  // Zoom actions
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFocusRecent: () => void;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  yAxisPadding,
  onYAxisPaddingChange,
  autoFit,
  onAutoFitChange,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  chartHeight,
  onChartHeightChange,
  visibleLines,
  onLineVisibilityChange,
  showCycleAnalysis,
  onCycleAnalysisChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFocusRecent,
}) => {
  const lineOptions = [
    { key: 'sma20', label: 'SMA 20', color: 'text-neutral' },
    { key: 'sma50', label: 'SMA 50', color: 'text-bearish' },
    { key: 'sma200', label: 'SMA 200', color: 'text-purple-400' },
    { key: 'ema20', label: 'EMA 20', color: 'text-accent' },
    { key: 'ema50', label: 'EMA 50', color: 'text-primary' },
    { key: 'ema200', label: 'EMA 200', color: 'text-chart-5' },
    { key: 'bbUpper', label: 'BB Upper', color: 'text-muted-foreground' },
    { key: 'bbLower', label: 'BB Lower', color: 'text-muted-foreground' },
    { key: 'vwap', label: 'VWAP', color: 'text-chart-1' },
  ];

  return (
    <Card className="p-4 mb-4 space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Zoom Controls */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onZoomIn}>
            <ZoomIn className="w-4 h-4 mr-1" />
            Zoom In
          </Button>
          <Button size="sm" variant="outline" onClick={onZoomOut}>
            <ZoomOut className="w-4 h-4 mr-1" />
            Zoom Out
          </Button>
          <Button size="sm" variant="outline" onClick={onResetZoom}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button size="sm" variant="outline" onClick={onFocusRecent}>
            <Maximize2 className="w-4 h-4 mr-1" />
            Focus Recent
          </Button>
        </div>

        {/* Y-Axis Controls */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Y-Axis Padding:</label>
          <Select value={yAxisPadding?.toString() || "10"} onValueChange={(value) => onYAxisPaddingChange(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0%</SelectItem>
              <SelectItem value="5">5%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="15">15%</SelectItem>
              <SelectItem value="20">20%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto-fit toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="auto-fit"
            checked={autoFit}
            onCheckedChange={onAutoFitChange}
          />
          <label htmlFor="auto-fit" className="text-sm font-medium">Auto-fit to data</label>
        </div>

        {/* Chart Height */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Height:</label>
          <Select value={chartHeight?.toString() || "400"} onValueChange={(value) => onChartHeightChange(Number(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="300">Small</SelectItem>
              <SelectItem value="400">Medium</SelectItem>
              <SelectItem value="500">Large</SelectItem>
              <SelectItem value="600">XL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range Controls */}
      {!autoFit && (
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">Price Range:</label>
          <Input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => onPriceRangeChange(Number(e.target.value), maxPrice || 0)}
            className="w-24"
          />
          <span className="text-sm">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => onPriceRangeChange(minPrice || 0, Number(e.target.value))}
            className="w-24"
          />
        </div>
      )}

      {/* Line Visibility Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <label className="text-sm font-medium">Show/Hide Indicators:</label>
        </div>
        <div className="flex flex-wrap gap-3">
          {lineOptions.map((line) => (
            <div key={line.key} className="flex items-center space-x-2">
              <Checkbox
                id={line.key}
                checked={visibleLines[line.key] ?? true}
                onCheckedChange={(checked) => onLineVisibilityChange(line.key, checked as boolean)}
              />
              <label htmlFor={line.key} className={`text-sm ${line.color}`}>
                {line.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle Analysis Controls */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Advanced Cycle Analysis:</label>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="cycle-analysis"
              checked={showCycleAnalysis}
              onCheckedChange={onCycleAnalysisChange}
            />
            <label htmlFor="cycle-analysis" className="text-sm">
              Show Cycle Analysis (with projections)
            </label>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChartControls;
