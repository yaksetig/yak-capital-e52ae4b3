import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, isToday, isYesterday, subDays } from 'date-fns';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import { Skeleton } from "@/components/ui/skeleton"

// Fear and Greed Index API URL
const FEAR_GREED_INDEX_API_URL = 'https://api.alternative.me/fng/';

// Function to format the timestamp to a readable date format
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds
  if (isToday(date)) {
    return format(date, "'Today,' h:mm a");
  } else if (isYesterday(date)) {
    return format(date, "'Yesterday,' h:mm a");
  } else if (date > subDays(new Date(), 7)) {
    return format(date, "EEEE, h:mm a");
  } else {
    return format(date, "MMM d, yyyy");
  }
};

const TradingDashboard: React.FC = () => {
  const [rawData, setRawData] = useState<any[] | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7'); // Default time range is 7 days
  const [fearGreedData, setFearGreedData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const chartHeight = 300;

  // Fetch Fear and Greed Index data
  useEffect(() => {
    const fetchFearGreedData = async () => {
      try {
        const response = await axios.get(FEAR_GREED_INDEX_API_URL);
        setFearGreedData(response.data.data[0]);
      } catch (error) {
        console.error("Failed to fetch Fear and Greed Index data:", error);
        setFearGreedData(null);
      }
    };

    fetchFearGreedData();
  }, []);

  // Fetch historical data based on the selected time range
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/historical-data?range=${timeRange}`);
        setRawData(response.data);
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
        setRawData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  // CCI Configuration
  const CCI_PERIOD = 20;

  // Helper function to calculate Commodity Channel Index (CCI)
  const calculateCCI = (candles: any[], period: number) => {
    if (candles.length < period) return null;
    
    const recentCandles = candles.slice(-period);
    
    // Calculate typical prices (HLC/3)
    const typicalPrices = recentCandles.map(candle => {
      const high = parseFloat(candle[2]);
      const low = parseFloat(candle[3]);
      const close = parseFloat(candle[4]);
      return (high + low + close) / 3;
    });
    
    // Calculate Simple Moving Average of typical prices
    const smaTP = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
    
    // Calculate Mean Deviation
    const meanDeviation = typicalPrices.reduce((sum, tp) => {
      return sum + Math.abs(tp - smaTP);
    }, 0) / period;
    
    // Calculate CCI
    const currentTP = typicalPrices[typicalPrices.length - 1];
    const cci = meanDeviation > 0 ? (currentTP - smaTP) / (0.015 * meanDeviation) : 0;
    
    return cci;
  };

  // Helper function to calculate CCI array for charting
  const calculateCCIArray = (candles: any[], period: number) => {
    if (candles.length < period) return [];
    
    const cciArray = [];
    
    for (let i = period - 1; i < candles.length; i++) {
      const periodCandles = candles.slice(i - period + 1, i + 1);
      
      // Calculate typical prices for this period
      const typicalPrices = periodCandles.map(candle => {
        const high = parseFloat(candle[2]);
        const low = parseFloat(candle[3]);
        const close = parseFloat(candle[4]);
        return (high + low + close) / 3;
      });
      
      // Calculate SMA of typical prices
      const smaTP = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
      
      // Calculate Mean Deviation
      const meanDeviation = typicalPrices.reduce((sum, tp) => {
        return sum + Math.abs(tp - smaTP);
      }, 0) / period;
      
      // Calculate CCI
      const currentTP = typicalPrices[typicalPrices.length - 1];
      const cci = meanDeviation > 0 ? (currentTP - smaTP) / (0.015 * meanDeviation) : 0;
      
      cciArray.push(cci);
    }
    
    return cciArray;
  };

  // Signal interpretation function
  const getCCISignal = (cci: number | null) => {
    if (cci === null) return "Unknown";
    if (cci > 100) return "Overbought";
    if (cci < -100) return "Oversold";
    return "Neutral";
  };

  // Helper function to calculate Simple Moving Average (SMA)
  const calculateSMA = (data: number[], period: number): number | null => {
    if (data.length < period) return null;
    const slice = data.slice(-period);
    const sum = slice.reduce((acc, val) => acc + val, 0);
    return sum / period;
  };

  // Helper function to calculate Relative Strength Index (RSI)
  const calculateRSI = (prices: number[], period: number = 14): number | null => {
    if (prices.length < period + 1) return null;

    let upChanges = 0;
    let downChanges = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        upChanges += change;
      } else {
        downChanges -= change;
      }
    }

    const averageGain = upChanges / period;
    const averageLoss = downChanges / period;

    if (averageLoss === 0) {
      return 100;
    }

    const relativeStrength = averageGain / averageLoss;
    const rsi = 100 - (100 / (1 + relativeStrength));

    return rsi;
  };

  // Helper function to calculate Moving Average Convergence Divergence (MACD)
  const calculateMACD = (prices: number[], shortPeriod: number = 12, longPeriod: number = 26, signalPeriod: number = 9) => {
    if (prices.length < longPeriod) {
      return { macd: null, signal: null, histogram: null };
    }

    const emaShort = calculateEMA(prices, shortPeriod);
    const emaLong = calculateEMA(prices, longPeriod);

    const macd = emaShort !== null && emaLong !== null ? emaShort - emaLong : null;

    const macdValues = [];
    for (let i = prices.length - longPeriod; i < prices.length; i++) {
      const periodPrices = prices.slice(0, i + 1);
      const periodEmaShort = calculateEMA(periodPrices, shortPeriod);
      const periodEmaLong = calculateEMA(periodPrices, longPeriod);
      const periodMacd = periodEmaShort !== null && periodEmaLong !== null ? periodEmaShort - periodEmaLong : null;
      macdValues.push(periodMacd);
    }

    const signal = calculateSMA(
      macdValues.filter(value => value !== null) as number[],
      signalPeriod
    );

    const histogram = macd !== null && signal !== null ? macd - signal : null;

    return { macd, signal, histogram };
  };

  // Helper function to calculate Exponential Moving Average (EMA)
  const calculateEMA = (prices: number[], period: number): number | null => {
    if (prices.length < period) {
      return null;
    }

    let ema = 0;
    const k = 2 / (period + 1);
    for (let i = prices.length - period; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }
    return ema;
  };

  // Helper function to calculate Stochastic Oscillator
  const calculateStochastic = (highs: number[], lows: number[], closes: number[], period: number = 14, smoothingPeriod: number = 3) => {
    if (highs.length !== lows.length || highs.length !== closes.length || highs.length < period) {
      return { k: null, d: null };
    }

    const highestHigh = Math.max(...highs.slice(-period));
    const lowestLow = Math.min(...lows.slice(-period));
    const currentClose = closes[closes.length - 1];

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    const kValues = [];
    for (let i = highs.length - period; i < highs.length; i++) {
      const periodHighs = highs.slice(0, i + 1);
      const periodLows = lows.slice(0, i + 1);
      const periodCloses = closes.slice(0, i + 1);
      const periodHighestHigh = Math.max(...periodHighs.slice(-period));
      const periodLowestLow = Math.min(...periodLows.slice(-period));
      const periodCurrentClose = periodCloses[periodCloses.length - 1];
      const periodK = ((periodCurrentClose - periodLowestLow) / (periodHighestHigh - periodLowestLow)) * 100;
      kValues.push(periodK);
    }

    const d = calculateSMA(kValues.filter(value => value !== null) as number[], smoothingPeriod);

    return { k, d };
  };

  // Calculate technical indicators
  const calculateIndicators = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return {
        sma20: null,
        sma50: null,
        rsi: null,
        rsiPeriod: 14,
        cci: null,
        cciSignal: "Unknown",
        macd: null,
        macdSignal: null,
        macdHistogram: null,
        stochK: null,
        stochD: null,
        stochSignal: "Unknown"
      };
    }

    const closes = rawData.map(candle => parseFloat(candle[4]));
    const highs = rawData.map(candle => parseFloat(candle[2]));
    const lows = rawData.map(candle => parseFloat(candle[3]));

    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const rsi = calculateRSI(closes, 14);
    const cci = calculateCCI(rawData, CCI_PERIOD);
    const cciSignal = getCCISignal(cci);
    const macd = calculateMACD(closes);
    const stoch = calculateStochastic(highs, lows, closes, 14, 3);

    return {
      sma20,
      sma50,
      rsi,
      rsiPeriod: 14,
      cci,
      cciSignal,
      macd: macd.macd,
      macdSignal: macd.signal,
      macdHistogram: macd.histogram,
      stochK: stoch.k,
      stochD: stoch.d,
      stochSignal: stoch.k !== null && stoch.d !== null ? 
        (stoch.k > 80 ? "Overbought" : stoch.k < 20 ? "Oversold" : "Neutral") : "Unknown"
    };
  }, [rawData]);

  // Get current price and calculate price change
  const currentPrice = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;
    return parseFloat(rawData[rawData.length - 1][4]);
  }, [rawData]);

  const priceChange = useMemo(() => {
    if (!rawData || rawData.length < 2) return null;
    const latestPrice = parseFloat(rawData[rawData.length - 1][4]);
    const previousPrice = parseFloat(rawData[0][4]);
    return ((latestPrice - previousPrice) / previousPrice) * 100;
  }, [rawData]);

  // Process chart data
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const closes = rawData.map(candle => parseFloat(candle[4]));
    const highs = rawData.map(candle => parseFloat(candle[2]));
    const lows = rawData.map(candle => parseFloat(candle[3]));

    // Calculate full arrays for charting
    const fullSMA20Array = [];
    const fullSMA50Array = [];
    const fullRSIArray = [];
    const fullCCIArray = calculateCCIArray(rawData, CCI_PERIOD);

    for (let i = 0; i < closes.length; i++) {
      if (i >= 19) {
        fullSMA20Array.push(calculateSMA(closes.slice(0, i + 1), 20));
      } else {
        fullSMA20Array.push(null);
      }
      
      if (i >= 49) {
        fullSMA50Array.push(calculateSMA(closes.slice(0, i + 1), 50));
      } else {
        fullSMA50Array.push(null);
      }
      
      if (i >= 13) {
        fullRSIArray.push(calculateRSI(closes.slice(0, i + 1), 14));
      } else {
        fullRSIArray.push(null);
      }
    }

    return rawData.map((candle, index) => ({
      date: formatTimestamp(candle[0]),
      price: parseFloat(candle[4]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      open: parseFloat(candle[1]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      sma20: fullSMA20Array[index],
      sma50: fullSMA50Array[index],
      rsi: fullRSIArray[index],
      cci: index >= CCI_PERIOD - 1 ? fullCCIArray[index - CCI_PERIOD + 1] : null,
      macd: index >= 25 ? indicators.macd : null,
      macdSignal: index >= 25 ? indicators.macdSignal : null,
      macdHistogram: index >= 25 ? indicators.macdHistogram : null,
      stochK: index >= 13 ? indicators.stochK : null,
      stochD: index >= 15 ? indicators.stochD : null,
    }));
  }, [rawData, indicators]);

  // Filter chart data based on the selected time range
  const filteredChartData = useMemo(() => {
    if (!chartData) return [];
    return chartData;
  }, [chartData]);

  // Info cards data
  const infoCards = [
    {
      title: "Current Price",
      value: currentPrice ? `$${currentPrice.toLocaleString()}` : "Loading...",
      change: priceChange !== null ? `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%` : "N/A",
      isPositive: priceChange >= 0,
      description: "24h change"
    },
    {
      title: "SMA 20",
      value: indicators.sma20 ? `$${indicators.sma20.toLocaleString()}` : "N/A",
      change: currentPrice && indicators.sma20 ? 
        `${currentPrice > indicators.sma20 ? '+' : ''}${(((currentPrice - indicators.sma20) / indicators.sma20) * 100).toFixed(2)}%` : "N/A",
      isPositive: currentPrice && indicators.sma20 ? currentPrice > indicators.sma20 : false,
      description: "vs current price"
    },
    {
      title: "SMA 50",
      value: indicators.sma50 ? `$${indicators.sma50.toLocaleString()}` : "N/A",
      change: currentPrice && indicators.sma50 ? 
        `${currentPrice > indicators.sma50 ? '+' : ''}${(((currentPrice - indicators.sma50) / indicators.sma50) * 100).toFixed(2)}%` : "N/A",
      isPositive: currentPrice && indicators.sma50 ? currentPrice > indicators.sma50 : false,
      description: "vs current price"
    },
    {
      title: "RSI (14)",
      value: indicators.rsi ? indicators.rsi.toFixed(2) : "N/A",
      change: indicators.rsi ? 
        (indicators.rsi > 70 ? "Overbought" : indicators.rsi < 30 ? "Oversold" : "Neutral") : "Unknown",
      isPositive: indicators.rsi ? indicators.rsi >= 30 && indicators.rsi <= 70 : false,
      description: "momentum indicator"
    },
    {
      title: "CCI (20)",
      value: indicators.cci ? indicators.cci.toFixed(2) : "N/A",
      change: indicators.cciSignal,
      isPositive: indicators.cciSignal === "Neutral",
      description: "commodity channel index"
    },
    {
      title: "Fear & Greed Index",
      value: fearGreedData?.value || "N/A",
      change: fearGreedData?.value_classification || "Unknown",
      isPositive: fearGreedData?.value_classification === "Greed" || fearGreedData?.value_classification === "Extreme Greed",
      description: "market sentiment"
    }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Trading Dashboard</h1>
          <p className="text-muted-foreground">Real-time data and analysis</p>
        </div>
        <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} className="ml-auto" />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {infoCards.map((card, index) => (
          <Card key={index} className="p-4 shadow-card border-border">
            <Card className="p-4 shadow-card border-border">
              <Card>
                <Card>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                    <span className="text-lg font-semibold text-foreground">{isLoading ? <Skeleton className="h-4 w-[100px]" /> : card.value}</span>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-xs font-medium ${card.isPositive ? 'text-bullish' : 'text-bearish'}`}>
                    {isLoading ? <Skeleton className="h-4 w-[50px]" /> : card.change}
                  </span>
                  <span className="text-xs text-muted-foreground">{card.description}</span>
                </div>
              </div>
                </Card>
                </Card>
                </Card>
          </Card>
        ))}
      </div>

      {/* Price Chart */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-foreground">Price Chart</h2>
        </div>
        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={['dataMin', 'dataMax']} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value) => [`$${typeof value === 'number' ? value.toFixed(2) : 'N/A'}`, 'Price']}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="sma20" stroke="hsl(var(--bullish))" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="sma50" stroke="hsl(var(--bearish))" strokeWidth={1} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* CCI Chart */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-foreground">CCI (20)</h2>
        </div>
        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[-200, 200]} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'CCI (20)']}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <ReferenceLine y={100} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Overbought" />
              <ReferenceLine y={-100} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Oversold" />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
              <Line type="monotone" dataKey="cci" stroke="hsl(var(--accent))" strokeWidth={2} name="CCI (20)" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* RSI Chart */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-foreground">RSI (14)</h2>
        </div>
        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'RSI (14)']}
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
              <Line type="monotone" dataKey="rsi" stroke="hsl(var(--accent))" strokeWidth={2} name="RSI (14)" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default TradingDashboard;

// Custom tick formatter function to display date
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return format(date, "MMM d, yyyy");
};
