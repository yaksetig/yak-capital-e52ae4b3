import React, { useState, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';

interface VWAPChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  formatPriceShort: (value: number) => string;
}

const VWAPChart: React.FC<VWAPChartProps> = ({ chartData, chartHeight, formatDate, formatPriceShort }) => {
  const [timeRange, setTimeRange] = useState('60');

  // Filter chart data based on selected time range
  const filteredChartData = useMemo(() => {
    if (timeRange === 'all') return chartData;
    
    const days = parseInt(timeRange);
    return chartData.slice(-days);
  }, [chartData, timeRange]);

  return (
    <Card className="p-6 mb-8 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-foreground">Price & VWAP Bands</h2>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={setTimeRange}
        />
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
            <YAxis tickFormatter={formatPriceShort} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              formatter={(value, name) => {
                if (typeof value === 'number') {
                  return [formatPriceShort(value), name];
                }
                return [value, name];
              }}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
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