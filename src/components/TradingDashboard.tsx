import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import StochasticChart from "@/components/StochasticChart"

interface TradingDashboardProps {
  stockSymbol: string;
  chartHeight: number;
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({ stockSymbol, chartHeight }) => {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data from an API
    setTimeout(() => {
      // Generate mock data
      const mockData = Array.from({ length: 50 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (49 - i));
        const price = 100 + Math.random() * 50;
        return {
          date: date.toISOString(),
          close: price,
          high: price + Math.random() * 5,
          low: price - Math.random() * 5,
          volume: Math.floor(Math.random() * 1000000),
          rsi: Math.random() * 100,
          macd: Math.random() * 2 - 1,
          signal: Math.random() * 2 - 1,
          histogram: Math.random() * 1 - 0.5
        };
      });
      setData(mockData);
      setLoading(false);
    }, 1000);
  }, [stockSymbol]);

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  const processChartData = (data: any[]) => {
    if (!data || data.length === 0) return [];

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate stochastic values for each data point
    const calculateStochastic = (dataSlice: any[], period: number = 14) => {
      if (dataSlice.length < period) return { stochK: null, stochD: null };
      
      const recentData = dataSlice.slice(-period);
      const highs = recentData.map(d => d.high);
      const lows = recentData.map(d => d.low);
      const currentClose = dataSlice[dataSlice.length - 1].close;
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      
      const stochK = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      
      return { stochK, stochD: null }; // %D will be calculated from %K smoothing
    };

    // Calculate %K values for all points
    const dataWithStochK = sortedData.map((item, index) => {
      const dataSlice = sortedData.slice(0, index + 1);
      const { stochK } = calculateStochastic(dataSlice);
      return { ...item, stochK };
    });

    // Calculate %D (3-period SMA of %K)
    const dataWithStochD = dataWithStochK.map((item, index) => {
      if (index < 2) return { ...item, stochD: null };
      
      const recentK = dataWithStochK.slice(index - 2, index + 1)
        .map(d => d.stochK)
        .filter(k => k !== null);
      
      const stochD = recentK.length === 3 ? recentK.reduce((sum, k) => sum + k, 0) / 3 : null;
      
      return { ...item, stochD };
    });

    return dataWithStochD.map(item => ({
      date: item.date,
      price: item.close,
      volume: item.volume,
      rsi: item.rsi,
      macd: item.macd,
      signal: item.signal,
      histogram: item.histogram,
      stochK: item.stochK,
      stochD: item.stochD
    }));
  };

  const chartData = data ? processChartData(data) : [];

  if (loading) {
    return (
      <div className="grid gap-4">
        <Card className="col-span-2 p-6 shadow-card border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Price Chart</h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Loading price data...
              </p>
            </div>
          </div>
          <Skeleton className="w-full rounded-md" style={{ height: chartHeight }} />
        </Card>
        <Card className="col-span-1 p-6 shadow-card border-border">
          <h2 className="text-xl font-semibold text-foreground mb-2">Stochastic Oscillator</h2>
          <Skeleton className="w-full rounded-md" style={{ height: chartHeight * 0.6 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Card className="col-span-2 p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Price Chart</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Price movement over time.
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => formatDate(value)}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => formatDate(value)}
              formatter={(value: any) => [value?.toFixed(2), 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--chart-1))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="col-span-1 p-6 shadow-card border-border">
        <StochasticChart chartData={chartData} chartHeight={chartHeight * 0.6} formatDate={formatDate} />
      </Card>
    </div>
  );
};

export default TradingDashboard;
