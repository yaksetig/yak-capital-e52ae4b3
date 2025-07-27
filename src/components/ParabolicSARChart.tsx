import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface ParabolicSARChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
}

const ParabolicSARChart: React.FC<ParabolicSARChartProps> = ({ chartData, chartHeight, formatDate }) => {
  const latest = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const recommendation = latest && latest.parabolicSAR != null && latest.price != null
    ? (latest.price > latest.parabolicSAR ? 'BUY' : 'SELL')
    : 'HOLD';
  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Parabolic SAR</h2>
          <p className="text-sm text-muted-foreground">
            The Parabolic SAR highlights potential trend reversals. When price crosses above the SAR it suggests buying momentum, while crossing below signals selling pressure.
          </p>
          {latest && latest.parabolicSAR != null && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Current SAR: </span>
                <span className="font-semibold">{latest.parabolicSAR.toFixed(2)}</span>
              </div>
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">Recommendation: </span>
                <span className={`font-semibold ${recommendation === 'BUY' ? 'text-green-600' : recommendation === 'SELL' ? 'text-red-600' : 'text-yellow-600'}`}>{recommendation}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
            <Line type="monotone" dataKey="price" stroke="hsl(var(--foreground))" strokeWidth={2} name="Price" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="parabolicSAR" stroke="hsl(var(--primary))" strokeWidth={2} name="Parabolic SAR" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ParabolicSARChart;
