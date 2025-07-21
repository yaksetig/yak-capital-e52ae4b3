import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Stock } from "@/types"
import { format, parseISO } from 'date-fns';
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { generateRandomStockData } from "@/lib/utils"
import { Sparkline } from "@/components/sparkline"
import { mockData } from "@/data/mock-data"
import { CandleStickChart } from "@/components/CandleStickChart"
import { TradingView } from "@/components/TradingView"
import { RsiChart } from "@/components/RsiChart"
import { MacdChart } from "@/components/MacdChart"
import { StochasticChart } from "@/components/StochasticChart"

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
          <h2 className="text-xl font-semibold text-foreground mb-2">RSI</h2>
          <Skeleton className="w-full rounded-md" style={{ height: chartHeight * 0.3 }} />
        </Card>
        <Card className="col-span-1 p-6 shadow-card border-border">
          <h2 className="text-xl font-semibold text-foreground mb-2">MACD</h2>
          <Skeleton className="w-full rounded-md" style={{ height: chartHeight * 0.3 }} />
        </Card>
        <Card className="col-span-1 p-6 shadow-card border-border">
          <h2 className="text-xl font-semibold text-foreground mb-2">Stochastic Oscillator</h2>
          <Skeleton className="w-full rounded-md" style={{ height: chartHeight * 0.3 }} />
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
              Interactive price chart with volume and average price.
            </p>
          </div>
        </div>
        <CandleStickChart chartData={chartData} chartHeight={chartHeight} formatDate={formatDate} />
      </Card>

      <Card className="col-span-1 p-6 shadow-card border-border">
        <RsiChart chartData={chartData} chartHeight={chartHeight} formatDate={formatDate} />
      </Card>

      <Card className="col-span-1 p-6 shadow-card border-border">
        <MacdChart chartData={chartData} chartHeight={chartHeight} formatDate={formatDate} />
      </Card>

      <Card className="col-span-1 p-6 shadow-card border-border">
        <StochasticChart chartData={chartData} chartHeight={chartHeight} formatDate={formatDate} />
      </Card>
    </div>
  );
};

export default TradingDashboard;
