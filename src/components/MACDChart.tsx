import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';

interface MACDChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
}

const MACDChart: React.FC<MACDChartProps> = ({ chartData, chartHeight, formatDate }) => {
  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Moving Average Convergence Divergence (MACD)</h2>
          <p className="text-sm text-muted-foreground">
            MACD is calculated by subtracting the 26-period Exponential Moving Average (EMA) from the 12-period EMA. The result of that calculation is the MACD line. A nine-day EMA of the MACD called the "signal line", is then plotted in addition to the MACD line. This together functions as a trigger for Bitcoin BTC buy and sell.
          </p>
          {chartData.length > 0 && chartData[chartData.length - 1].macd !== null && chartData[chartData.length - 1].macdSignal !== null && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Current Status: MACD {chartData[chartData.length - 1].macd > chartData[chartData.length - 1].macdSignal ? '>' : '<'} Signal
                </span>
                <span className={`font-semibold ${chartData[chartData.length - 1].macd > chartData[chartData.length - 1].macdSignal ? 'text-green-500' : 'text-red-500'}`}>
                  {chartData[chartData.length - 1].macd > chartData[chartData.length - 1].macdSignal ? 'BUY' : 'SELL'}
                </span>
              </div>
            </div>
          )}
        </div>
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
                
                const macdValue = data.macd;
                const signalValue = data.macdSignal;
                
                if (macdValue === null || signalValue === null) return '';
                
                const recommendation = macdValue > signalValue ? 'Buy' : 'Sell';
                const recommendationColor = macdValue > signalValue ? '#22c55e' : '#ef4444';
                
                return (
                  <div style={{ color: 'hsl(var(--foreground))' }}>
                    <div>Date: {formatDate(label)}</div>
                    <div style={{ color: 'hsl(var(--primary))' }}>MACD: {macdValue.toFixed(4)}</div>
                    <div style={{ color: 'hsl(var(--bearish))' }}>Signal: {signalValue.toFixed(4)}</div>
                    <div style={{ color: recommendationColor, fontWeight: 'bold' }}>
                      Recommendation: {recommendation}
                    </div>
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
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
            <Line type="monotone" dataKey="macd" stroke="hsl(var(--primary))" strokeWidth={2} name="MACD" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="macdSignal" stroke="hsl(var(--bearish))" strokeWidth={2} name="Signal" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default MACDChart;