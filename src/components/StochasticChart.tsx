import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';

interface StochasticChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
}

const StochasticChart: React.FC<StochasticChartProps> = ({ chartData, chartHeight, formatDate }) => {
  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Stochastic Oscillator (14,3)</h2>
          <p className="text-sm text-muted-foreground">
            The Stochastic Oscillator compares a security's closing price to its price range over a given time period. The %K line represents the current position within the range, while %D is a smoothed version that acts as a signal line.
          </p>
        </div>
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
            <ReferenceLine y={80} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Overbought" />
            <ReferenceLine y={20} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Oversold" />
            <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
            <Line type="monotone" dataKey="stochK" stroke="hsl(var(--primary))" strokeWidth={2} name="%K" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="stochD" stroke="hsl(var(--chart-3))" strokeWidth={2} name="%D" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default StochasticChart;