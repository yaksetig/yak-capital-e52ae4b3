
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import ChartContainer from './ChartContainer';
import { ProcessedDataPoint } from '@/hooks/useProcessedChartData';

interface RSIChartProps {
  data: ProcessedDataPoint[];
  formatDate: (date: string) => string;
  height?: number;
}

const RSIChart: React.FC<RSIChartProps> = ({ data, formatDate, height = 300 }) => {
  return (
    <ChartContainer 
      title="RSI (14)" 
      description="Relative Strength Index - momentum oscillator measuring speed and change of price movements"
      height={height}
    >
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
        <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
        <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
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
        <ReferenceLine y={70} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Overbought" />
        <ReferenceLine y={30} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Oversold" />
        <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
        <Line type="monotone" dataKey="rsi" stroke="hsl(var(--primary))" strokeWidth={2} name="RSI" dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
};

export default RSIChart;
