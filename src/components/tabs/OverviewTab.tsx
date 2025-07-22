
import React from 'react';
import { TabProps } from '@/types/trading';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { formatDate, getChartHeight } from '@/utils/chartUtils';

const OverviewTab: React.FC<TabProps> = ({ 
  chartData, 
  loading, 
  symbol, 
  timeRange, 
  onTimeRangeChange 
}) => {
  const chartHeight = getChartHeight();
  const latestData = chartData[chartData.length - 1];
  const previousData = chartData[chartData.length - 2];
  
  const priceChange = latestData && previousData 
    ? latestData.price - previousData.price 
    : 0;
  const priceChangePercent = previousData 
    ? (priceChange / previousData.price) * 100 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{symbol.toUpperCase()}/USD</h1>
          {latestData && (
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-semibold text-foreground">
                ${latestData.price.toLocaleString()}
              </span>
              <span className={`text-lg font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={onTimeRangeChange}
        />
      </div>

      {/* Main Price Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">Price Chart</h2>
          <p className="text-sm text-muted-foreground">
            {symbol.toUpperCase()} price movement over the selected time period
          </p>
        </div>
        
        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate} 
                stroke="hsl(var(--muted-foreground))" 
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Price']}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">24h High</div>
          <div className="text-xl font-semibold text-foreground">
            ${Math.max(...chartData.map(d => d.price)).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">24h Low</div>
          <div className="text-xl font-semibold text-foreground">
            ${Math.min(...chartData.map(d => d.price)).toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Volume</div>
          <div className="text-xl font-semibold text-foreground">
            {latestData?.volume ? latestData.volume.toLocaleString() : 'N/A'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Data Points</div>
          <div className="text-xl font-semibold text-foreground">
            {chartData.length}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
