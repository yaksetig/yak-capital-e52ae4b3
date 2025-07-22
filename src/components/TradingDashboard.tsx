
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card"
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { useM2GlobalData } from '@/hooks/useM2GlobalData';
import { format, parseISO } from 'date-fns';
import TimeRangeSelector from './TimeRangeSelector';
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatPriceShort } from '@/lib/utils';
import NewsSection from './NewsSection';
import AIRecommendationSection from './AIRecommendationSection';
import MACDChart from './MACDChart';
import StochasticChart from './StochasticChart';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import InfoCard from './InfoCard';

// Define a type for the chart data
interface ChartData {
  date: string;
  price: number | null;
  m2Supply: number | null;
  rsi?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  macdHistogram?: number | null;
  stochK?: number | null;
  stochD?: number | null;
}

// Function to format the date for the chart
const formatDate = (date: string) => {
  return format(parseISO(date), 'MMM dd, yyyy');
};

// Function to format M2 supply
const formatM2Supply = (value: number) => {
  if (value >= 1_000_000_000_000) {
    return (value / 1_000_000_000_000).toFixed(2) + 'T';
  }
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

// Technical indicator calculations
const calculateRSI = (prices: number[], period: number = 14) => {
  if (prices.length < period + 1) return null;
  
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);
  
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

const calculateMACD = (prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
  if (prices.length < slowPeriod) return { macd: null, signal: null, histogram: null };
  
  const ema = (data: number[], period: number) => {
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  };
  
  const fastEMA = ema(prices.slice(-fastPeriod), fastPeriod);
  const slowEMA = ema(prices.slice(-slowPeriod), slowPeriod);
  const macdValue = fastEMA - slowEMA;
  
  // For signal line, we'd need historical MACD values
  const signal = macdValue * 0.9; // Simplified
  const histogram = macdValue - signal;
  
  return { macd: macdValue, signal, histogram };
};

const calculateStochastic = (highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3) => {
  if (closes.length < kPeriod) return { k: null, d: null };
  
  const recentHigh = Math.max(...highs.slice(-kPeriod));
  const recentLow = Math.min(...lows.slice(-kPeriod));
  const currentClose = closes[closes.length - 1];
  
  const k = ((currentClose - recentLow) / (recentHigh - recentLow)) * 100;
  const d = k * 0.9; // Simplified moving average
  
  return { k, d };
};

const TradingDashboard = () => {
  // State for time range selection
  const [timeRange, setTimeRange] = useState('1y');
  const [showCycleAnalysis, setShowCycleAnalysis] = useState(false);

  // Fetch Bitcoin price data
  const { data: bitcoinPriceData, loading: priceLoading, error: priceError } = useBitcoinPrice();

  // Fetch M2 global data
  const { data: m2Data, loading: m2Loading, error: m2Error } = useM2GlobalData();

  // State for chart height
  const [chartHeight, setChartHeight] = useState(400);

  // Update chart height on window resize
  useEffect(() => {
    const handleResize = () => {
      setChartHeight(window.innerWidth < 640 ? 300 : 400);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to filter data based on the selected time range
  const filterDataByTimeRange = useCallback((data: ChartData[], range: string) => {
    if (!data || data.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '60':
        startDate = new Date(now.setDate(now.getDate() - 60));
        break;
      case '90':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
        return data;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= startDate;
    });
  }, []);

  // Combine and process data for the chart
  const chartData: ChartData[] = React.useMemo(() => {
    console.log('Processing chart data...', { 
      bitcoinPriceData: bitcoinPriceData?.length, 
      m2Data: m2Data?.length 
    });

    if (!bitcoinPriceData || bitcoinPriceData.length === 0) {
      console.log('No Bitcoin price data available');
      return [];
    }

    if (!m2Data || m2Data.length === 0) {
      console.log('No M2 data available');
      return [];
    }

    // Create a map of M2 data by date for faster lookup
    const m2DataMap = new Map();
    m2Data.forEach(item => {
      m2DataMap.set(item.date, item.m2Supply);
    });

    // Process Bitcoin data and add technical indicators
    const processedData: ChartData[] = [];
    const prices: number[] = [];
    
    bitcoinPriceData.forEach((priceItem, index) => {
      prices.push(priceItem.price);
      
      // Get M2 supply for this date (or closest date)
      const m2Supply = m2DataMap.get(priceItem.date) || null;
      
      // Calculate technical indicators
      const rsi = index >= 14 ? calculateRSI(prices.slice(Math.max(0, index - 13), index + 1)) : null;
      const macdData = index >= 26 ? calculateMACD(prices.slice(Math.max(0, index - 25), index + 1)) : { macd: null, signal: null, histogram: null };
      const stochData = index >= 14 ? calculateStochastic(
        prices.slice(Math.max(0, index - 13), index + 1), // Using price as proxy for high/low
        prices.slice(Math.max(0, index - 13), index + 1),
        prices.slice(Math.max(0, index - 13), index + 1)
      ) : { k: null, d: null };
      
      processedData.push({
        date: priceItem.date,
        price: priceItem.price,
        m2Supply,  
        rsi,
        macd: macdData.macd,
        macdSignal: macdData.signal,
        macdHistogram: macdData.histogram,
        stochK: stochData.k,
        stochD: stochData.d
      });
    });

    console.log('Chart data processed:', { 
      totalPoints: processedData.length, 
      withPrice: processedData.filter(d => d.price !== null).length,
      withM2: processedData.filter(d => d.m2Supply !== null).length,
      sample: processedData[0]
    });

    return processedData;
  }, [bitcoinPriceData, m2Data]);

  // Filter chart data based on the selected time range
  const filteredChartData = React.useMemo(() => {
    return filterDataByTimeRange(chartData, timeRange);
  }, [chartData, timeRange, filterDataByTimeRange]);

  // Determine the Y-axis domain based on the filtered data
  const yAxisDomain = React.useMemo(() => {
    if (!filteredChartData || filteredChartData.length === 0) {
      return [0, 'auto'];
    }

    const prices = filteredChartData.map(item => item.price).filter(price => typeof price === 'number') as number[];
    if (prices.length === 0) return [0, 'auto'];
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const padding = (maxPrice - minPrice) * 0.05;
    return [minPrice - padding, maxPrice + padding];
  }, [filteredChartData]);

  // Get current market data for AI recommendations
  const currentData = filteredChartData.length > 0 ? filteredChartData[filteredChartData.length - 1] : null;
  const marketData = currentData ? {
    price: currentData.price || undefined,
    rsi: currentData.rsi || undefined,
    macd: currentData.macd && currentData.macdSignal ? 
      (currentData.macd > currentData.macdSignal ? 'BUY' : 'SELL') : undefined
  } : undefined;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Bitcoin Trading Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive analysis of Bitcoin price movements, technical indicators, and market data.</p>
      </header>

      {/* Main Price vs M2 Chart */}
      <Card className="p-6 mb-8 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Bitcoin Price vs Global Liquidity (M2)</h2>
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
              {priceError && m2Error && ' | '}
              {m2Error && `M2 data error: ${m2Error.message}`}
            </p>
          </div>
        )}
        
        <div className={`bg-chart-bg rounded-lg p-4`} style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                yAxisId="price"
                orientation="left"
                domain={yAxisDomain as [number, number]}
                tickFormatter={formatPriceShort}
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
                name="Bitcoin Price" 
                dot={false} 
                isAnimationActive={false} 
                connectNulls={false}
              />
              
              {filteredChartData.some(d => d.m2Supply) && (
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

      {/* Cycle Analysis Panel */}
      <CycleAnalysisPanel 
        cycles={[]}
        cycleStrength={0}
        isVisible={showCycleAnalysis}
      />

      {/* Technical Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MACDChart 
          chartData={filteredChartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
        />
        
        <StochasticChart 
          chartData={filteredChartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
        />
      </div>

      {/* Time Series Momentum Chart */}
      <div className="mb-8">
        <TimeSeriesMomentumChart 
          chartData={filteredChartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      </div>

      {/* Market Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 shadow-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Bitcoin Price</h3>
          {priceLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : priceError ? (
            <p className="text-sm text-destructive">Failed to load price data.</p>
          ) : (
            <p className="text-2xl font-bold text-primary">
              {bitcoinPriceData && bitcoinPriceData.length > 0 ? 
                formatPrice(bitcoinPriceData[bitcoinPriceData.length - 1].price) : 'N/A'}
            </p>
          )}
        </Card>

        <Card className="p-4 shadow-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">M2 Money Supply</h3>
          {m2Loading ? (
            <Skeleton className="h-6 w-full" />
          ) : m2Error ? (
            <p className="text-sm text-destructive">Failed to load M2 data.</p>
          ) : (
            <p className="text-2xl font-bold text-primary">
              {m2Data && m2Data.length > 0 ? 
                formatM2Supply(m2Data[m2Data.length - 1].m2Supply) : 'N/A'}
            </p>
          )}
        </Card>

        <Card className="p-4 shadow-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">RSI (14)</h3>
          <p className="text-2xl font-bold text-primary">
            {currentData?.rsi ? currentData.rsi.toFixed(2) : 'N/A'}
          </p>
          {currentData?.rsi && (
            <p className={`text-sm mt-1 ${currentData.rsi > 70 ? 'text-red-600' : currentData.rsi < 30 ? 'text-green-600' : 'text-muted-foreground'}`}>
              {currentData.rsi > 70 ? 'Overbought' : currentData.rsi < 30 ? 'Oversold' : 'Neutral'}
            </p>
          )}
        </Card>
      </div>

      {/* News and AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <NewsSection symbol="CRYPTO:BTC" />
        <AIRecommendationSection symbol="BTC" marketData={marketData} />
      </div>

      {/* Educational Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard
          title="What is M2 Money Supply?"
          shortDescription="M2 includes cash, checking deposits, and easily convertible near money."
          detailedExplanation="M2 is a measure of the money supply that includes cash, checking deposits, savings deposits, money market securities, mutual funds, and other time deposits. It represents the total amount of money in circulation plus liquid assets that can quickly be converted to cash."
          tradingTip="When M2 supply increases rapidly, it often leads to inflation concerns and can drive investors toward Bitcoin as a hedge against currency debasement."
        />
        
        <InfoCard
          title="Bitcoin-M2 Correlation"
          shortDescription="How Bitcoin price relates to global liquidity measures."
          detailedExplanation="The relationship between Bitcoin and M2 money supply suggests that as central banks increase money supply (quantitative easing), Bitcoin often appreciates as investors seek alternatives to fiat currency. This correlation became more pronounced after 2020."
          tradingTip="Watch for periods of rapid M2 expansion as potential buying opportunities for Bitcoin, especially when combined with other bullish technical indicators."
        />
        
        <InfoCard
          title="Technical Analysis"
          shortDescription="Using indicators like MACD, RSI, and Stochastic for trading decisions."
          detailedExplanation="Technical analysis combines multiple indicators to identify entry and exit points. MACD shows momentum changes, RSI indicates overbought/oversold conditions, and Stochastic helps confirm trend reversals."
          tradingTip="Never rely on a single indicator. Use multiple confirmations and always consider the broader market context including macroeconomic factors like M2 supply."
        />
      </div>
    </div>
  );
};

export default TradingDashboard;
