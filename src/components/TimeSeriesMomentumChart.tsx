import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';

interface TimeSeriesMomentumChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const TimeSeriesMomentumChart: React.FC<TimeSeriesMomentumChartProps> = ({ chartData, chartHeight, formatDate, timeRange, onTimeRangeChange }) => {
  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Time Series Momentum</h2>
          <p className="text-sm text-muted-foreground">
            Bitcoin price movement over time showing the momentum and trend direction.
          </p>
        </div>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={onTimeRangeChange}
          className="scale-90"
        />
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              formatter={() => [null, null]}
              labelFormatter={(label, payload) => {
                if (!payload || payload.length === 0) return '';
                
                const data = payload[0]?.payload;
                if (!data) return '';
                
                const priceValue = data.price;
                
                if (priceValue === null || priceValue === undefined) return '';
                
                return (
                  <div style={{ color: 'hsl(var(--foreground))' }}>
                    <div>Date: {formatDate(label)}</div>
                    <div style={{ color: 'hsl(var(--primary))' }}>Price: ${priceValue.toLocaleString()}</div>
                  </div>
                );
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} name="BTC Price" dot={false} isAnimationActive={false} />
            
            {/* First point marker */}
            {chartData.length > 0 && (
              <ReferenceDot 
                x={chartData[0].date} 
                y={chartData[0].price} 
                r={6} 
                fill="#ef4444" 
                stroke="#dc2626" 
                strokeWidth={2}
              />
            )}
            
            {/* Last point marker */}
            {chartData.length > 1 && (
              <ReferenceDot 
                x={chartData[chartData.length - 1].date} 
                y={chartData[chartData.length - 1].price} 
                r={6} 
                fill="#ef4444" 
                stroke="#dc2626" 
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TimeSeriesMomentumChart;