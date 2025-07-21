import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Activity, Zap, Settings, Info, AlertTriangle, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';
import TimeRangeSelector from './TimeRangeSelector';
import MACDChart from './MACDChart';
import StochasticChart from './StochasticChart';
import ROCChart from './ROCChart';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';
import ChartControls from './ChartControls';
import InfoCard from './InfoCard';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import AIRecommendationSection from './AIRecommendationSection';
import NewsSection from './NewsSection';
import { useRealtimePrice } from '../hooks/useRealtimePrice';
import { useCurrentCandle } from '../hooks/useCurrentCandle';
import LivePriceIndicator from './LivePriceIndicator';

interface OhlcData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ProcessedData extends OhlcData {
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  stochK: number | null;
  stochD: number | null;
  roc: number | null;
  isLive?: boolean;
}

const calculateRSI = (data: OhlcData[], period: number = 14): number | null => {
  if (data.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (data: OhlcData[]) => {
  const ema = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    let emaArray: number[] = [];
    emaArray[0] = data[0];

    for (let i = 1; i < data.length; i++) {
      emaArray[i] = data[i] * k + emaArray[i - 1] * (1 - k);
    }

    return emaArray;
  };

  const closeValues = data.map(item => item.close);
  const ema12 = ema(closeValues, 12);
  const ema26 = ema(closeValues, 26);

  const macd: number[] = [];
  for (let i = 0; i < data.length; i++) {
    macd[i] = ema12[i] - ema26[i];
  }

  const signal = ema(macd, 9);
  const histogram: number[] = [];

  for (let i = 0; i < data.length; i++) {
    histogram[i] = macd[i] - signal[i];
  }

  return {
    macd: macd[macd.length - 1],
    signal: signal[signal.length - 1],
    histogram: histogram[histogram.length - 1],
  };
};

const calculateBollingerBands = (data: OhlcData[], period: number, stdDev: number) => {
  const prices = data.map(item => item.close);
  const middleBand = prices.slice(-period).reduce((sum, price) => sum + price, 0) / period;
  const stdDeviation = Math.sqrt(prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - middleBand, 2), 0) / period);
  const upperBand = middleBand + stdDev * stdDeviation;
  const lowerBand = middleBand - stdDev * stdDeviation;

  return {
    upper: upperBand,
    middle: middleBand,
    lower: lowerBand,
  };
};

const calculateStochastic = (data: OhlcData[], period: number, smoothingPeriod: number) => {
  const prices = data.map(item => item.close);
  const highestHigh = Math.max(...prices.slice(-period));
  const lowestLow = Math.min(...prices.slice(-period));
  const currentClose = prices[prices.length - 1];

  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

  let d = null;
  if (data.length >= smoothingPeriod) {
    const kValues = prices.slice(-smoothingPeriod).map((_, i) => {
      const highestHigh = Math.max(...prices.slice(-period - smoothingPeriod + 1 + i, prices.length - smoothingPeriod + 1 + i));
      const lowestLow = Math.min(...prices.slice(-period - smoothingPeriod + 1 + i, prices.length - smoothingPeriod + 1 + i));
      const currentClose = prices[prices.length - smoothingPeriod + i];
      return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    });
    d = kValues.reduce((sum, value) => sum + value, 0) / smoothingPeriod;
  }

  return {
    k,
    d,
  };
};

const calculateROC = (data: OhlcData[], period: number) => {
  if (data.length <= period) {
    return null;
  }

  const currentPrice = data[data.length - 1].close;
  const priceAgo = data[data.length - 1 - period].close;
  const roc = ((currentPrice - priceAgo) / priceAgo) * 100;

  return roc;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const TradingDashboard = () => {
  const [rawData, setRawData] = useState<OhlcData[]>([]);
  const [selectedRange, setSelectedRange] = useState('1y');
  const [chartHeight, setChartHeight] = useState(300);
  const [rocPeriod, setRocPeriod] = useState(14);

  // Add real-time price hooks
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const {
    currentPrice,
    previousPrice,
    priceChange,
    priceChangePercent,
    isLoading: priceLoading,
    error: priceError,
    lastUpdate,
  } = useRealtimePrice('BTCUSDT', realtimeEnabled);

  const {
    currentCandle,
    isLoading: candleLoading,
    error: candleError,
  } = useCurrentCandle('BTCUSDT', currentPrice, realtimeEnabled);

  const fetchData = useCallback(async (range: string) => {
    try {
      const endDate = new Date();
      let startDate = new Date();

      switch (range) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '1w':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '1m':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case 'ytd': {
          startDate = new Date(endDate.getFullYear(), 0, 1);
          break;
        }
        case 'all':
          startDate = new Date(2009, 0, 3);
          break;
        default:
          startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const startTimestamp = startDate.getTime();
      const endTimestamp = endDate.getTime();

      const apiUrl = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startTimestamp}&endTime=${endTimestamp}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const ohlcData: OhlcData[] = data.map((item: any) => ({
        date: new Date(item[0]).toISOString(),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));

      setRawData(ohlcData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedRange);
  }, [selectedRange, fetchData]);

  // Enhanced data processing with real-time updates
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const processedRawData = rawData.map((item, index) => {
      const rsi = index >= 13 ? calculateRSI(rawData.slice(0, index + 1), 14) : null;
      
      const macdData = index >= 25 ? calculateMACD(rawData.slice(0, index + 1)) : { macd: null, signal: null, histogram: null };
      
      const bollinger = index >= 19 ? calculateBollingerBands(rawData.slice(0, index + 1), 20, 2) : { upper: null, middle: null, lower: null };
      
      const stochastic = index >= 13 ? calculateStochastic(rawData.slice(0, index + 1), 14, 3) : { k: null, d: null };
      
      const roc = index >= rocPeriod ? calculateROC(rawData.slice(0, index + 1), rocPeriod) : null;

      return {
        date: item.date,
        price: item.close,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        rsi,
        macd: macdData.macd,
        macdSignal: macdData.signal,
        macdHistogram: macdData.histogram,
        bollingerUpper: bollinger.upper,
        bollingerMiddle: bollinger.middle,
        bollingerLower: bollinger.lower,
        stochK: stochastic.k,
        stochD: stochastic.d,
        roc,
      };
    });

    // Merge real-time data if available
    if (realtimeEnabled && currentCandle && currentPrice) {
      const today = new Date().toISOString().split('T')[0];
      const lastDataPoint = processedRawData[processedRawData.length - 1];
      const lastDataDate = lastDataPoint?.date.split('T')[0];

      // Create live data point
      const liveDataPoint = {
        date: today,
        price: currentPrice,
        open: currentCandle.open,
        high: currentCandle.high,
        low: currentCandle.low,
        close: currentPrice,
        volume: currentCandle.volume,
        // For live data, use the same indicators as the last complete candle
        rsi: lastDataPoint?.rsi || null,
        macd: lastDataPoint?.macd || null,
        macdSignal: lastDataPoint?.macdSignal || null,
        macdHistogram: lastDataPoint?.macdHistogram || null,
        bollingerUpper: lastDataPoint?.bollingerUpper || null,
        bollingerMiddle: lastDataPoint?.bollingerMiddle || null,
        bollingerLower: lastDataPoint?.bollingerLower || null,
        stochK: lastDataPoint?.stochK || null,
        stochD: lastDataPoint?.stochD || null,
        roc: lastDataPoint?.roc || null,
        isLive: true, // Flag to identify live data
      };

      // If last data is from today, replace it; otherwise, append
      if (lastDataDate === today) {
        return [...processedRawData.slice(0, -1), liveDataPoint];
      } else {
        return [...processedRawData, liveDataPoint];
      }
    }

    return processedRawData;
  }, [rawData, currentCandle, currentPrice, realtimeEnabled, rocPeriod]);

  const chartData = useMemo(() => {
    return processedData.map(item => ({
      date: item.date,
      price: item.price,
    }));
  }, [processedData]);

  const handleResize = () => {
    setChartHeight(window.innerHeight * 0.4);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Bitcoin Trading Dashboard</h1>
            <p className="text-sm text-muted-foreground">Advanced technical analysis and market insights</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
            <Button
              variant={realtimeEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {realtimeEnabled ? 'Live Updates On' : 'Live Updates Off'}
            </Button>
            <TimeRangeSelector selectedRange={selectedRange} onRangeChange={setSelectedRange} />
          </div>
        </div>

        {/* Live Price Indicator */}
        {realtimeEnabled && (
          <LivePriceIndicator
            currentPrice={currentPrice}
            priceChange={priceChange}
            priceChangePercent={priceChangePercent}
            lastUpdate={lastUpdate}
            isLoading={priceLoading}
            error={priceError}
          />
        )}

        {/* Main Content */}
        <Tabs defaultvalue="overview" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <Activity className="w-4 h-4 mr-2" />
              Technical Analysis
            </TabsTrigger>
            <TabsTrigger value="cycle">
              <Target className="w-4 h-4 mr-2" />
              Cycle Analysis
            </TabsTrigger>
            <TabsTrigger value="ai">
              <AlertTriangle className="w-4 h-4 mr-2" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="news">
              <Info className="w-4 h-4 mr-2" />
              Market News
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard title="Current Price" value={currentPrice ? `$${currentPrice.toFixed(2)}` : 'Loading...'} icon={TrendingUp} />
              <InfoCard title="24h Volume" value={`${rawData[rawData.length - 1]?.volume.toFixed(2)} BTC`} icon={BarChart3} />
              <InfoCard title="RSI (14)" value={processedData[processedData.length - 1]?.rsi ? processedData[processedData.length - 1]?.rsi?.toFixed(2) : 'N/A'} icon={Activity} />
            </div>
            <Card className="p-6 shadow-card border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Price Chart</h2>
                  <p className="text-sm text-muted-foreground">Bitcoin price over time</p>
                </div>
                <ChartControls rocPeriod={rocPeriod} setRocPeriod={setRocPeriod} />
              </div>
              <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                    <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={['dataMin', 'dataMax']} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', name]}
                      labelFormatter={(label) => `Date: ${formatDate(label)}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                    {processedData[processedData.length - 1]?.bollingerUpper && processedData[processedData.length - 1]?.bollingerLower && (
                      <>
                        <Line type="monotone" dataKey="bollingerUpper" stroke="hsl(var(--chart-2))" strokeWidth={1} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="bollingerMiddle" stroke="hsl(var(--chart-3))" strokeWidth={1} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="bollingerLower" stroke="hsl(var(--chart-4))" strokeWidth={1} dot={false} isAnimationActive={false} />
                      </>
                    )}
                    {processedData[processedData.length - 1]?.isLive && (
                      <ReferenceLine x={formatDate(processedData[processedData.length - 1]?.date)} stroke="hsl(var(--primary))" strokeDasharray="3 3" label="Live" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MACDChart chartData={processedData} chartHeight={chartHeight} formatDate={formatDate} />
              <StochasticChart chartData={processedData} chartHeight={chartHeight} formatDate={formatDate} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ROCChart chartData={processedData} chartHeight={chartHeight} formatDate={formatDate} rocPeriod={rocPeriod} />
              <TimeSeriesMomentumChart chartData={processedData} chartHeight={chartHeight} formatDate={formatDate} />
            </div>
          </TabsContent>
          <TabsContent value="cycle">
            <CycleAnalysisPanel />
          </TabsContent>
          <TabsContent value="ai">
            <AIRecommendationSection />
          </TabsContent>
          <TabsContent value="news">
            <NewsSection />
          </TabsContent>
          <TabsContent value="settings">
            <Card className="p-6 shadow-card border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-foreground">Enable Notifications</p>
                  <Button variant="outline" size="sm">
                    Coming Soon
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-foreground">Dark Mode</p>
                  <Button variant="outline" size="sm">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TradingDashboard;
