
import React from 'react';
import { TabProps } from '@/types/trading';
import { formatDate, getChartHeight } from '@/utils/chartUtils';
import MACDChart from '@/components/MACDChart';
import StochasticChart from '@/components/StochasticChart';
import TimeSeriesMomentumChart from '@/components/TimeSeriesMomentumChart';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const TechnicalAnalysisTab: React.FC<TabProps> = ({ 
  chartData, 
  loading, 
  symbol, 
  timeRange, 
  onTimeRangeChange,
  indicators 
}) => {
  const chartHeight = getChartHeight();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // RSI Chart
  const RSIChart = () => (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Relative Strength Index (RSI)</h2>
          <p className="text-sm text-muted-foreground">
            RSI measures the speed and change of price movements. Values above 70 indicate overbought conditions, while values below 30 suggest oversold conditions.
          </p>
          {indicators.rsi !== null && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Current RSI: </span>
                <span className={`font-semibold ${
                  indicators.rsi > 70 ? 'text-red-600' : 
                  indicators.rsi < 30 ? 'text-green-600' : 
                  'text-yellow-600'
                }`}>
                  {indicators.rsi.toFixed(2)}
                </span>
                <span className="ml-2 text-xs">
                  ({indicators.rsi > 70 ? 'Overbought' : indicators.rsi < 30 ? 'Oversold' : 'Neutral'})
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
            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'RSI']}
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
        </ResponsiveContainer>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Technical Analysis</h2>
        <p className="text-muted-foreground">
          Comprehensive technical indicators and analysis for {symbol.toUpperCase()}
        </p>
      </div>

      {/* RSI Chart */}
      <RSIChart />

      {/* MACD Chart */}
      <MACDChart 
        chartData={chartData}
        chartHeight={chartHeight}
        formatDate={formatDate}
      />

      {/* Stochastic Chart */}
      <StochasticChart 
        chartData={chartData}
        chartHeight={chartHeight}
        formatDate={formatDate}
      />

      {/* Time Series Momentum */}
      <TimeSeriesMomentumChart 
        chartData={chartData}
        chartHeight={chartHeight}
        formatDate={formatDate}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />
    </div>
  );
};

export default TechnicalAnalysisTab;
