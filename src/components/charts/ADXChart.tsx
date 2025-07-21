
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import ChartContainer from './ChartContainer';
import { ProcessedDataPoint } from '@/hooks/useProcessedChartData';

interface ADXChartProps {
  data: ProcessedDataPoint[];
  formatDate: (date: string) => string;
  height?: number;
}

const ADXChart: React.FC<ADXChartProps> = ({ data, formatDate, height = 300 }) => {
  return (
    <ChartContainer 
      title="ADX (14)" 
      description="Average Directional Index - measures the strength of a trend"
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
        <ReferenceLine y={25} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" label="Strong Trend" />
        <ReferenceLine y={50} stroke="hsl(var(--chart-3))" strokeDasharray="2 2" label="Very Strong" />
        <Line type="monotone" dataKey="adx" stroke="hsl(var(--primary))" strokeWidth={2} name="ADX" dot={false} isAnimationActive={false} />
      </LineChart>
    </ChartContainer>
  );
};

export default ADXChart;
