
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import ChartContainer from './ChartContainer';
import { ProcessedDataPoint } from '@/hooks/useProcessedChartData';

interface ZScoreChartProps {
  data: ProcessedDataPoint[];
  formatDate: (date: string) => string;
  height?: number;
}

const ZScoreChart: React.FC<ZScoreChartProps> = ({ data, formatDate, height = 300 }) => {
  return (
    <ChartContainer 
      title="Z-Score (20)" 
      description="Statistical measure showing how many standard deviations an element is from the mean"
      height={height}
    >
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
        <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip 
          formatter={(value, name) => [typeof value === 'number' ? value.toFixed(3) : 'N/A', name]}
          labelFormatter={(label) => `Date: ${formatDate(label)}`}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))'
          }}
        />
        <ReferenceLine y={2} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Overbought" />
        <ReferenceLine y={-2} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Oversold" />
        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
        <Line type="monotone" dataKey="zScore" stroke="hsl(var(--primary))" strokeWidth={2} name="Z-Score" dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
};

export default ZScoreChart;
