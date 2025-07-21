
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import ChartContainer from './ChartContainer';
import { ProcessedDataPoint } from '@/hooks/useProcessedChartData';

interface PriceChartProps {
  data: ProcessedDataPoint[];
  formatDate: (date: string) => string;
  height?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, formatDate, height = 400 }) => {
  return (
    <ChartContainer 
      title="Bitcoin Price with Moving Averages" 
      description="Price action with 20-day and 50-day simple moving averages"
      height={height}
    >
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
        <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip 
          formatter={(value, name) => [typeof value === 'number' ? `$${value.toFixed(2)}` : 'N/A', name]}
          labelFormatter={(label) => `Date: ${formatDate(label)}`}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))'
          }}
        />
        <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} name="Price" dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="sma20" stroke="hsl(var(--chart-2))" strokeWidth={1} name="SMA 20" dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="sma50" stroke="hsl(var(--chart-3))" strokeWidth={1} name="SMA 50" dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
};

export default PriceChart;
