
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import ChartContainer from './ChartContainer';
import { ProcessedDataPoint } from '@/hooks/useProcessedChartData';

interface CCIChartProps {
  data: ProcessedDataPoint[];
  formatDate: (date: string) => string;
  height?: number;
}

const CCIChart: React.FC<CCIChartProps> = ({ data, formatDate, height = 300 }) => {
  return (
    <ChartContainer 
      title="CCI (20)" 
      description="Commodity Channel Index - momentum-based oscillator used to help determine when an investment has been overbought or oversold"
      height={height}
    >
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
        <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip 
          formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', name]}
          labelFormatter={(label) => `Date: ${formatDate(label)}`}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))'
          }}
        />
        <ReferenceLine y={100} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Overbought" />
        <ReferenceLine y={-100} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Oversold" />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
        <Line type="monotone" dataKey="cci" stroke="hsl(var(--primary))" strokeWidth={2} name="CCI" dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
};

export default CCIChart;
