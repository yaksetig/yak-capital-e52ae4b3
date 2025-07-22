
import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';
import { useM2GlobalData } from '../hooks/useM2GlobalData';

const IndependentM2Chart = () => {
  const [timeRange, setTimeRange] = useState('60');
  const [chartHeight] = useState(400);
  
  // Get unified data from Supabase
  const { data: allData, loading, error } = useM2GlobalData();

  // Filter data based on selected time range
  const chartData = useMemo(() => {
    if (!allData.length) return [];

    // If "all" is selected, return all data
    if (timeRange === 'all') {
      return allData;
    }

    // Filter by number of days
    const days = parseInt(timeRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
  }, [allData, timeRange]);

  const formatPrice = (value) => `$${value.toLocaleString()}`;
  const formatM2Supply = (value) => `$${(value / 1e12).toFixed(1)}T`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  return (
    <Card className="p-6 mb-8 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Price vs Global Liquidity (M2) - Complete Historical Data</h2>
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
        </div>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={setTimeRange}
        />
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            Error loading data: {error.message}
          </p>
        </div>
      )}
      
      <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              yAxisId="price"
              orientation="left"
              tickFormatter={formatPrice}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              yAxisId="m2"
              orientation="right"
              tickFormatter={formatM2Supply}
              stroke="hsl(var(--primary))"
              domain={[50000000000000, 'dataMax']}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Bitcoin Price') return [formatPrice(Number(value)), name];
                if (name === 'M2 Supply') return [formatM2Supply(Number(value)), name];
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
            
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="btcPrice" 
              stroke="hsl(var(--foreground))" 
              strokeWidth={3} 
              name="Bitcoin Price" 
              dot={false} 
              isAnimationActive={false} 
            />
            
            <Line 
              yAxisId="m2"
              type="monotone" 
              dataKey="m2Supply" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3} 
              name="M2 Supply" 
              dot={false} 
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default IndependentM2Chart;
