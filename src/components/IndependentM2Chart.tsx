import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';
import { useM2GlobalData } from '../hooks/useM2GlobalData';

// Independent price data fetching from Binance (separate from main dashboard)
const useBinancePriceData = () => {
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPriceData = async (timeRange: string) => {
    setLoading(true);
    setError(null);
    try {
      // Calculate limit based on timeRange
      let limit = 60; // default
      switch(timeRange) {
        case '7': limit = 7; break;
        case '30': limit = 30; break;
        case '60': limit = 60; break;
        case '90': limit = 90; break;
        case 'all': limit = 1000; break;
        default: limit = 60;
      }

      const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=${limit}`);
      const data = await response.json();
      
      const formattedData = data.map(candle => ({
        date: new Date(candle[0]).toISOString().split('T')[0],
        price: parseFloat(candle[4]) // Close price
      }));
      
      setPriceData(formattedData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { priceData, loading, error, fetchPriceData };
};

const IndependentM2Chart = () => {
  const [timeRange, setTimeRange] = useState('60');
  const [chartHeight] = useState(400);
  
  // Independent data sources
  const { priceData, loading: priceLoading, error: priceError, fetchPriceData } = useBinancePriceData();
  const { data: m2Data, loading: m2Loading, error: m2Error } = useM2GlobalData();

  // Fetch price data when timeRange changes
  React.useEffect(() => {
    fetchPriceData(timeRange);
  }, [timeRange]);

  // Combine price and M2 data independently
  const chartData = React.useMemo(() => {
    if (!priceData.length || !m2Data.length) return [];

    const m2Map = new Map(m2Data.map(item => [item.date, item.m2Supply]));
    
    return priceData.map(priceItem => ({
      date: priceItem.date,
      price: priceItem.price,
      m2Supply: m2Map.get(priceItem.date) || null
    }));
  }, [priceData, m2Data]);

  const formatPrice = (value) => `$${value.toLocaleString()}`;
  const formatM2Supply = (value) => `$${(value / 1e12).toFixed(1)}T`;
  const formatDate = (date) => new Date(date).toLocaleDateString();

  return (
    <Card className="p-6 mb-8 shadow-card border-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Price vs Global Liquidity (M2) - Independent</h2>
          {(priceLoading || m2Loading) && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
        </div>
        <TimeRangeSelector 
          selectedRange={timeRange}
          onRangeChange={setTimeRange}
        />
      </div>
      
      {(priceError || m2Error) && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">
            {priceError && `Price data error: ${priceError.message}`}
            {m2Error && `M2 data error: ${m2Error.message}`}
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
              stroke="hsl(var(--chart-2))"
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Price') return [formatPrice(Number(value)), name];
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
              dataKey="price" 
              stroke="hsl(var(--foreground))" 
              strokeWidth={3} 
              name="Price" 
              dot={false} 
              isAnimationActive={false} 
            />
            
            {chartData.some(d => d.m2Supply) && (
              <Line 
                yAxisId="m2"
                type="monotone" 
                dataKey="m2Supply" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2} 
                name="M2 Supply" 
                dot={false} 
                isAnimationActive={false}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default IndependentM2Chart;