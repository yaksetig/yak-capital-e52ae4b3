
import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';

interface ROCChartProps {
  chartData: any[];
  chartHeight: number;
  formatDate: (date: string) => string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const ROCChart: React.FC<ROCChartProps> = ({ chartData, chartHeight, formatDate, timeRange, onTimeRangeChange }) => {
  // Calculate dynamic period based on time range
  const getDynamicPeriod = (range: string) => {
    switch (range) {
      case '7': return 7;
      case '30': return 20;
      case '60': return 30;
      case '90': return 45;
      case 'all': return 90;
      default: return 20;
    }
  };

  const period = getDynamicPeriod(timeRange);
  
  // Calculate ROC for each data point
  const dataWithROC = chartData.map((item, index) => {
    if (index < period) {
      return { ...item, roc: null };
    }
    
    const currentPrice = item.price;
    const nDaysAgoPrice = chartData[index - period].price;
    
    if (nDaysAgoPrice === 0) {
      return { ...item, roc: null };
    }
    
    const roc = ((currentPrice - nDaysAgoPrice) / nDaysAgoPrice) * 100;
    return { ...item, roc };
  });

  // Calculate current ROC for display in info box
  let currentROC = 0;
  let currentPrice = 0;
  let isPositive = false;
  
  if (chartData.length >= period + 1) {
    const todayPrice = chartData[chartData.length - 1].price;
    const nDaysAgoPrice = chartData[chartData.length - 1 - period].price;
    currentPrice = todayPrice;
    
    if (nDaysAgoPrice !== 0) {
      currentROC = ((todayPrice - nDaysAgoPrice) / nDaysAgoPrice) * 100;
      isPositive = currentROC > 0;
    }
  }

  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">ROC vs Price</h2>
          <p className="text-sm text-muted-foreground">
            Rate of Change ({period}-period) compared with Bitcoin price movement.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            BTC Price (USD): <span className="font-semibold text-foreground">${currentPrice.toLocaleString()}</span>
          </p>
          
          {/* ROC Calculation */}
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <span className="text-muted-foreground">Current ROC ({period}): </span>
              <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {currentROC.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-muted-foreground">Signal: </span>
              <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? 'Bullish' : 'Bearish'}
              </span>
            </div>
          </div>
        </div>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={onTimeRangeChange}
          className="scale-90"
        />
      </div>
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dataWithROC}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
            
            {/* Single Y-axis for ROC */}
            <YAxis 
              stroke="hsl(var(--accent))" 
              label={{ value: 'ROC (%)', angle: -90, position: 'insideLeft' }}
            />
            
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'BTC Price') {
                  return [`$${Number(value).toLocaleString()}`, name];
                } else if (name === `ROC (${period})`) {
                  return [`${Number(value).toFixed(2)}%`, name];
                }
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
            
            {/* Reference lines for ROC */}
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
            <ReferenceLine y={10} stroke="hsl(var(--bullish))" strokeDasharray="1 1" opacity={0.5} />
            <ReferenceLine y={-10} stroke="hsl(var(--bearish))" strokeDasharray="1 1" opacity={0.5} />
            
            {/* Price Line - White */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#ffffff" 
              strokeWidth={2} 
              name="BTC Price" 
              dot={false} 
              isAnimationActive={false}
              yAxisId="hidden"
              hide={true}
            />
            
            {/* ROC Line - Blue */}
            <Line 
              type="monotone" 
              dataKey="roc" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2} 
              name={`ROC (${period})`} 
              dot={false} 
              isAnimationActive={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ROCChart;
