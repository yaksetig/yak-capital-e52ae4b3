import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';

interface WilliamsRChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
}

const WilliamsRChart: React.FC<WilliamsRChartProps> = ({ chartData, chartHeight, formatDate }) => {
  const latest = chartData.length > 0 ? chartData[chartData.length - 1].williamsR : null;
  let recommendation = 'HOLD';
  if (latest !== null && latest !== undefined) {
    if (latest < -80) recommendation = 'BUY';
    else if (latest > -20) recommendation = 'SELL';
  }
  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Williams %R (10)</h2>
          <p className="text-sm text-muted-foreground">
            The Williams %R oscillator highlights overbought and oversold levels. Values above -20 suggest overbought while below -80 indicate oversold conditions.
          </p>
          {latest !== null && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Current %R: </span>
                <span className="font-semibold">{latest.toFixed(2)}</span>
              </div>
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">Recommendation: </span>
                <span className={`font-semibold ${
                  recommendation === 'BUY' ? 'text-green-600' :
                  recommendation === 'SELL' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {recommendation}
                </span>
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
            <YAxis domain={[-100, 0]} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'Williams %R']}
              labelFormatter={(label) => `Date: ${formatDate(label)}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <ReferenceLine y={-20} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Overbought" />
            <ReferenceLine y={-80} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Oversold" />
            <Line type="monotone" dataKey="williamsR" stroke="hsl(var(--primary))" strokeWidth={2} name="Williams %R" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default WilliamsRChart;
