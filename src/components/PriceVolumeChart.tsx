import React from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface PriceVolumeChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  formatPriceShort: (value: number) => string;
}

const PriceVolumeChart: React.FC<PriceVolumeChartProps> = ({ chartData, chartHeight, formatDate, formatPriceShort }) => {
  const formatVolume = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toFixed(0);
  };

  return (
    <Card className="p-6 mb-8 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-foreground">Price vs Volume</h2>
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="price" orientation="left" tickFormatter={formatPriceShort} stroke="hsl(var(--muted-foreground))" />
            <YAxis yAxisId="volume" orientation="right" tickFormatter={formatVolume} stroke="hsl(var(--chart-2))" />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'Price') return [formatPriceShort(Number(value)), name];
                if (name === 'Volume') return [formatVolume(Number(value)), name];
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
            <Bar yAxisId="volume" dataKey="volume" fill="hsl(var(--chart-2))" name="Volume" />
            <Line yAxisId="price" type="monotone" dataKey="price" stroke="hsl(var(--foreground))" strokeWidth={3} name="Price" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default PriceVolumeChart;
