
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';

interface TimeSeriesMomentumChartProps {
  chartData: Array<{
    date: string;
    price: number;
    volume: number;
  }>;
  chartHeight: number;
  formatDate: (dateStr: string) => string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const TimeSeriesMomentumChart: React.FC<TimeSeriesMomentumChartProps> = ({
  chartData,
  chartHeight,
  formatDate,
  timeRange,
  onTimeRangeChange
}) => {
  const { filteredData, momentum, firstPoint, lastPoint } = useMemo(() => {
    if (!chartData.length) return { filteredData: [], momentum: 0, firstPoint: null, lastPoint: null };

    const now = new Date();
    let filteredData = chartData;

    if (timeRange !== 'all') {
      const days = parseInt(timeRange);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filteredData = chartData.filter(item => new Date(item.date) >= cutoffDate);
    }

    if (filteredData.length === 0) return { filteredData: [], momentum: 0, firstPoint: null, lastPoint: null };

    const firstPoint = filteredData[0];
    const lastPoint = filteredData[filteredData.length - 1];
    const momentum = firstPoint.price ? ((lastPoint.price - firstPoint.price) / firstPoint.price) * 100 : 0;

    return { filteredData, momentum, firstPoint, lastPoint };
  }, [chartData, timeRange]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isFirst = payload.date === firstPoint?.date;
    const isLast = payload.date === lastPoint?.date;

    if (isFirst || isLast) {
      return (
        <Dot 
          cx={cx} 
          cy={cy} 
          r={6} 
          fill={isFirst ? "#3b82f6" : "#ef4444"} 
          stroke="#ffffff" 
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  const momentumColor = momentum >= 0 ? "text-green-600" : "text-red-600";
  const momentumSign = momentum >= 0 ? "+" : "";

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-foreground mb-2">
              Time Series Momentum
              <span className={`ml-3 text-lg font-bold ${momentumColor}`}>
                {momentumSign}{momentum.toFixed(2)}%
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Time Series Momentum measures the percentage change from the first price point to the last price point over the selected time period. 
              The blue dot marks the starting point and the red dot marks the current endpoint.
            </p>
          </div>
          <TimeRangeSelector
            selectedRange={timeRange}
            onRangeChange={onTimeRangeChange}
            className="flex-shrink-0"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                labelFormatter={(label) => formatDate(label)}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  name === 'price' ? 'Price' : name
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8884d8"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 4, stroke: '#8884d8', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesMomentumChart;
