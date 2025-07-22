
import React, { useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';
import { useM2GlobalData } from '../hooks/useM2GlobalData';

interface IndependentM2ChartProps {
  filteredChartData: any[];
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  chartHeight: number;
  formatDate: (date: string) => string;
  formatPrice: (price: number) => string;
  formatPriceShort: (price: number) => string;
  formatM2Supply: (value: number) => string;
  yAxisDomain: any;
}

const IndependentM2Chart: React.FC<IndependentM2ChartProps> = ({
  filteredChartData,
  timeRange,
  onTimeRangeChange,
  chartHeight,
  formatDate,
  formatPrice,
  formatPriceShort,
  formatM2Supply,
  yAxisDomain
}) => {
  const { data: m2Data, loading: m2Loading, error: m2Error } = useM2GlobalData();

  // Combine price data with M2 data
  const combinedM2Data = useMemo(() => {
    if (!filteredChartData.length || !m2Data.length) return filteredChartData;
    
    return filteredChartData.map(pricePoint => {
      const m2Point = m2Data.find(m2 => {
        const priceDate = new Date(pricePoint.date).toDateString();
        const m2Date = new Date(m2.date).toDateString();
        return priceDate === m2Date;
      });

      return {
        ...pricePoint,
        m2Supply: m2Point?.m2Supply || null
      };
    });
  }, [filteredChartData, m2Data]);

  return (
    <Card className="p-6 mb-8 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Price vs Global Liquidity (M2 Supply)</h2>
          {m2Loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
        </div>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={onTimeRangeChange}
        />
      </div>
      
      {m2Error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">Failed to load M2 data: {m2Error.message}</p>
        </div>
      )}
      
      <div className={`bg-chart-bg rounded-lg p-4`} style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedM2Data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              yAxisId="price"
              orientation="left"
              domain={yAxisDomain}
              tickFormatter={formatPriceShort}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              yAxisId="m2"
              orientation="right"
              tickFormatter={formatM2Supply}
              stroke="hsl(var(--chart-2))"
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Price') return [formatPrice(Number(value)), name];
                if (name === 'M2 Supply') return [formatM2Supply(Number(value)), name];
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
            
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--foreground))" 
              strokeWidth={3} 
              name="Price" 
              dot={false} 
              isAnimationActive={false} 
            />
            
            {combinedM2Data.some(d => d.m2Supply) && (
              <Line 
                yAxisId="m2"
                type="monotone" 
                dataKey="m2Supply" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2} 
                name="M2 Supply" 
                dot={false} 
                isAnimationActive={false}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default IndependentM2Chart;
