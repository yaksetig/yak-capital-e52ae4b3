import React, { useState, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import TimeRangeSelector from './TimeRangeSelector';

interface VWAPChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  formatPriceShort: (value: number) => string;
}

const VWAPChart: React.FC<VWAPChartProps> = ({ chartData, chartHeight, formatDate, formatPriceShort }) => {
  const [timeRange, setTimeRange] = useState('60');
  const [autoFit, setAutoFit] = useState(true);
  const [yAxisPadding, setYAxisPadding] = useState(10);
  const [manualPriceRange, setManualPriceRange] = useState({ min: '', max: '' });

  // Filter chart data based on selected time range
  const filteredChartData = useMemo(() => {
    if (timeRange === 'all') return chartData;
    
    const days = parseInt(timeRange);
    return chartData.slice(-days);
  }, [chartData, timeRange]);

  // Calculate Y-axis domain for auto-fit
  const calculateYAxisDomain = (data: any[], padding = 10) => {
    if (!data || data.length === 0) return ['auto', 'auto'];

    const values: number[] = [];
    data.forEach((d: any) => {
      if (d.price != null) values.push(d.price);
      if (d.vwap != null) values.push(d.vwap);
      if (d.vwapUpper1 != null) values.push(d.vwapUpper1);
      if (d.vwapLower1 != null) values.push(d.vwapLower1);
      if (d.vwapUpper2 != null) values.push(d.vwapUpper2);
      if (d.vwapLower2 != null) values.push(d.vwapLower2);
      if (d.vwapUpper3 != null) values.push(d.vwapUpper3);
      if (d.vwapLower3 != null) values.push(d.vwapLower3);
    });

    if (values.length === 0) return ['auto', 'auto'];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const paddingAmount = (range * padding) / 100;

    return [min - paddingAmount, max + paddingAmount];
  };

  // Calculate Y-axis domain
  const yAxisDomain = autoFit 
    ? calculateYAxisDomain(filteredChartData, yAxisPadding)
    : (manualPriceRange.min !== '' && manualPriceRange.max !== ''
        ? [parseFloat(manualPriceRange.min), parseFloat(manualPriceRange.max)]
        : ['auto', 'auto']);

  return (
    <Card className="p-6 mb-8 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-foreground">Price & VWAP Bands</h2>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={setTimeRange}
        />
      </div>
      
      {/* Chart Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="auto-fit" 
            checked={autoFit}
            onCheckedChange={(checked) => setAutoFit(checked === true)}
          />
          <label htmlFor="auto-fit" className="text-sm font-medium">Auto-fit to data</label>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Y-axis padding:</label>
          <Select value={yAxisPadding.toString()} onValueChange={(value) => setYAxisPadding(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5%</SelectItem>
              <SelectItem value="10">10%</SelectItem>
              <SelectItem value="15">15%</SelectItem>
              <SelectItem value="20">20%</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {!autoFit && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Price range:</label>
            <Input
              type="number"
              placeholder="Min"
              value={manualPriceRange.min}
              onChange={(e) => setManualPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-20"
            />
            <span className="text-sm">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={manualPriceRange.max}
              onChange={(e) => setManualPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-20"
            />
          </div>
        )}
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
            <YAxis 
              domain={yAxisDomain}
              tickFormatter={formatPriceShort} 
              stroke="hsl(var(--muted-foreground))" 
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                // Sort payload by value (highest to lowest)
                const sortedPayload = [...payload].sort((a, b) => {
                  const aValue = typeof a.value === 'number' ? a.value : 0;
                  const bValue = typeof b.value === 'number' ? b.value : 0;
                  return bValue - aValue;
                });
                
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '8px',
                    color: 'hsl(var(--foreground))'
                  }}>
                    <p style={{ marginBottom: '4px' }}>{`Date: ${formatDate(label)}`}</p>
                    {sortedPayload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
                        {`${entry.name}: ${typeof entry.value === 'number' ? formatPriceShort(entry.value) : entry.value}`}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />
            
            {/* VWAP Bands (from outermost to innermost) */}
            <Line 
              type="monotone" 
              dataKey="vwapUpper3" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={1} 
              strokeDasharray="5 5"
              name="VWAP +3σ" 
              dot={false} 
              isAnimationActive={false}
              strokeOpacity={0.4}
            />
            <Line 
              type="monotone" 
              dataKey="vwapLower3" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={1} 
              strokeDasharray="5 5"
              name="VWAP -3σ" 
              dot={false} 
              isAnimationActive={false}
              strokeOpacity={0.4}
            />
            
            <Line 
              type="monotone" 
              dataKey="vwapUpper2" 
              stroke="hsl(var(--chart-4))" 
              strokeWidth={1} 
              strokeDasharray="3 3"
              name="VWAP +2σ" 
              dot={false} 
              isAnimationActive={false}
              strokeOpacity={0.6}
            />
            <Line 
              type="monotone" 
              dataKey="vwapLower2" 
              stroke="hsl(var(--chart-4))" 
              strokeWidth={1} 
              strokeDasharray="3 3"
              name="VWAP -2σ" 
              dot={false} 
              isAnimationActive={false}
              strokeOpacity={0.6}
            />
            
            <Line 
              type="monotone" 
              dataKey="vwapUpper1" 
              stroke="hsl(var(--chart-5))" 
              strokeWidth={1} 
              strokeDasharray="2 2"
              name="VWAP +1σ" 
              dot={false} 
              isAnimationActive={false}
              strokeOpacity={0.8}
            />
            <Line 
              type="monotone" 
              dataKey="vwapLower1" 
              stroke="hsl(var(--chart-5))" 
              strokeWidth={1} 
              strokeDasharray="2 2"
              name="VWAP -1σ" 
              dot={false} 
              isAnimationActive={false}
              strokeOpacity={0.8}
            />
            
            {/* VWAP center line */}
            <Line 
              type="monotone" 
              dataKey="vwap" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              name="VWAP" 
              dot={false} 
              isAnimationActive={false}
            />
            
            {/* Price line */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--foreground))" 
              strokeWidth={3} 
              name="Price" 
              dot={false} 
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default VWAPChart;