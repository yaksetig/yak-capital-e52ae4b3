import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Brain, Target, Zap } from 'lucide-react';
import TimeRangeSelector from './TimeRangeSelector';
import ChartControls from './ChartControls';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import InfoCard from './InfoCard';
import NewsSection from './NewsSection';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';

// Helper function to generate mock data
const generateMockData = (timeRange: string) => {
  const now = new Date();
  let numberOfDataPoints = 30;

  switch (timeRange) {
    case '1D':
      numberOfDataPoints = 24;
      break;
    case '1W':
      numberOfDataPoints = 7;
      break;
    case '1M':
      numberOfDataPoints = 30;
      break;
    case '3M':
      numberOfDataPoints = 90;
      break;
    case '1Y':
      numberOfDataPoints = 365;
      break;
    case '5Y':
      numberOfDataPoints = 5 * 365;
      break;
    default:
      numberOfDataPoints = 30;
      break;
  }

  const data = [];
  for (let i = 0; i < numberOfDataPoints; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const open = Math.random() * 50 + 100;
    const close = open + Math.random() * 20 - 10;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    const volume = Math.random() * 1000;

    data.push({
      timestamp: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
    });
  }

  return data.reverse();
};

// Function to calculate Simple Moving Average (SMA)
const calculateSMA = (data: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    sma.push(sum / period);
  }
  return sma;
};

// Function to calculate Exponential Moving Average (EMA)
const calculateEMA = (data: number[], period: number): number[] => {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  ema[period - 1] = calculateSMA(data, period)[period - 1 - (period - 1)]; // First EMA value is SMA
  for (let i = period; i < data.length; i++) {
    ema[i] = data[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
};

// Function to calculate RSI
const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains[i] = change > 0 ? change : 0;
    losses[i] = change < 0 ? Math.abs(change) : 0;
  }

  let avgGain = calculateSMA(gains.slice(1), period)[period - 1];
  let avgLoss = calculateSMA(losses.slice(1), period)[period - 1];

  const rsi: number[] = [];
  for (let i = period; i < prices.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
};

// Function to calculate MACD
const calculateMACD = (prices: number[], shortPeriod: number = 12, longPeriod: number = 26, signalPeriod: number = 9) => {
  const emaShort = calculateEMA(prices, shortPeriod);
  const emaLong = calculateEMA(prices, longPeriod);

  const macd: number[] = [];
  for (let i = longPeriod - 1; i < prices.length; i++) {
    macd[i] = emaShort[i] - emaLong[i];
  }

  const signal = calculateEMA(macd.slice(longPeriod - 1), signalPeriod);

  return {
    macd,
    signal,
  };
};

// Function to calculate Bollinger Bands
const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
  const sma = calculateSMA(prices, period);
  const upperBand: number[] = [];
  const lowerBand: number[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(prices[i - j] - sma[i - period + 1], 2);
    }
    const std = Math.sqrt(sum / period);
    upperBand[i] = sma[i - period + 1] + stdDev * std;
    lowerBand[i] = sma[i - period + 1] - stdDev * std;
  }

  return {
    upperBand,
    lowerBand,
  };
};

const TradingDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1M');
  const [chartType, setChartType] = useState('candlestick');
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: false,
    rsi: true,
    macd: false,
    bollinger: false,
    volume: true
  });

  // Chart controls state
  const [yAxisPadding, setYAxisPadding] = useState(10);
  const [autoFit, setAutoFit] = useState(true);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [chartHeight, setChartHeight] = useState(400);
  const [visibleLines, setVisibleLines] = useState({
    sma20: true,
    sma50: true,
    ema20: true,
    ema50: true,
    bbUpper: true,
    bbLower: true,
    vwap: true,
  });
  const [showCycleAnalysis, setShowCycleAnalysis] = useState(false);

  const { data: fearGreedData, loading: fearGreedLoading } = useFearGreedIndex();

  const data = useMemo(() => generateMockData(selectedTimeRange), [selectedTimeRange]);

  // Enhanced Z-score calculations
  const calculateZScore = (value: number, mean: number, stdDev: number): number => {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  };

  const calculateZScoreArray = (values: number[]): number[] => {
    if (values.length === 0) return [];
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return values.map(val => calculateZScore(val, mean, stdDev));
  };

  const getZScoreSignal = (zScore: number): { signal: string; color: string; description: string } => {
    if (Math.abs(zScore) > 2.5) {
      return {
        signal: zScore > 0 ? 'Extremely Overbought' : 'Extremely Oversold',
        color: zScore > 0 ? 'text-red-600' : 'text-green-600',
        description: 'Strong reversal signal - extreme statistical deviation'
      };
    } else if (Math.abs(zScore) > 2) {
      return {
        signal: zScore > 0 ? 'Overbought' : 'Oversold',
        color: zScore > 0 ? 'text-orange-500' : 'text-blue-500',
        description: 'Moderate reversal signal - significant statistical deviation'
      };
    } else if (Math.abs(zScore) > 1) {
      return {
        signal: zScore > 0 ? 'Above Average' : 'Below Average',
        color: zScore > 0 ? 'text-yellow-500' : 'text-cyan-500',
        description: 'Minor deviation from statistical norm'
      };
    } else {
      return {
        signal: 'Normal Range',
        color: 'text-gray-500',
        description: 'Within normal statistical range'
      };
    }
  };

  // Calculate Z-scores for the current dataset
  const prices = data.map(d => d.close);
  const volumes = data.map(d => d.volume);
  const priceZScores = calculateZScoreArray(prices);
  const volumeZScores = calculateZScoreArray(volumes);

  // Enhanced chart data with Z-scores
  const chartData = data.map((item, index) => ({
    ...item,
    priceZScore: priceZScores[index] || 0,
    volumeZScore: volumeZScores[index] || 0
  }));

  // Current Z-score values for display
  const currentPriceZScore = priceZScores[priceZScores.length - 1] || 0;
  const currentVolumeZScore = volumeZScores[volumeZScores.length - 1] || 0;
  const priceZScoreSignal = getZScoreSignal(currentPriceZScore);
  const volumeZScoreSignal = getZScoreSignal(currentVolumeZScore);

  // Calculate moving averages
  const sma20 = calculateSMA(data.map(d => d.close), 20);
  const ema20 = calculateEMA(data.map(d => d.close), 20);

  // Add moving averages to chart data
  chartData.forEach((item, index) => {
    item.sma20 = sma20[index];
    item.ema20 = ema20[index];
  });

  const rsiValues = calculateRSI(data.map(d => d.close));
  const macdResult = calculateMACD(data.map(d => d.close));

  // Ensure that the lengths of rsiValues and macdResult.macd are the same as data
  const rsi = Array(data.length).fill(null);
  const macd = Array(data.length).fill(null);
  const macdSignal = Array(data.length).fill(null);

  rsiValues.forEach((value, index) => {
    rsi[index + 14] = value; // RSI is typically calculated with a 14-period window
  });

  macdResult.macd.forEach((value, index) => {
    macd[index + 25] = value; // MACD is calculated with 12 and 26 period EMAs
  });

  macdResult.signal.forEach((value, index) => {
    macdSignal[index + 25 + 8] = value; // MACD Signal is calculated with a 9 period EMA
  });

  // Add RSI and MACD data to chartData
  chartData.forEach((item, index) => {
    item.rsi = rsi[index];
    item.macd = macd[index];
    item.macdSignal = macdSignal[index];
  });

  // Chart control handlers
  const handlePriceRangeChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const handleLineVisibilityChange = (line: string, visible: boolean) => {
    setVisibleLines(prev => ({
      ...prev,
      [line]: visible
    }));
  };

  const handleZoomIn = () => {
    console.log('Zoom in');
  };

  const handleZoomOut = () => {
    console.log('Zoom out');
  };

  const handleResetZoom = () => {
    console.log('Reset zoom');
  };

  const handleFocusRecent = () => {
    console.log('Focus recent');
  };

  const latestData = data[data.length - 1];
  const rsiData = calculateRSI(data.map(d => d.close));
  const currentRSI = rsiData[rsiData.length - 1];
  const macdData = calculateMACD(data.map(d => d.close));
  const currentMACD = macdData.macd[macdData.macd.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Bitcoin Trading Dashboard
        </h1>
        <p className="text-gray-600">Advanced Technical Analysis & Market Intelligence</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <TimeRangeSelector selectedRange={selectedTimeRange} onRangeChange={setSelectedTimeRange} />
        <ChartControls 
          yAxisPadding={yAxisPadding}
          onYAxisPaddingChange={setYAxisPadding}
          autoFit={autoFit}
          onAutoFitChange={setAutoFit}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceRangeChange={handlePriceRangeChange}
          chartHeight={chartHeight}
          onChartHeightChange={setChartHeight}
          visibleLines={visibleLines}
          onLineVisibilityChange={handleLineVisibilityChange}
          showCycleAnalysis={showCycleAnalysis}
          onCycleAnalysisChange={setShowCycleAnalysis}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFocusRecent={handleFocusRecent}
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          title="Current Price"
          shortDescription={`$${latestData?.close.toLocaleString() || 0}`}
          detailedExplanation={`Current market price with ${latestData ? ((latestData.close - latestData.open) / latestData.open * 100).toFixed(2) : '0'}% change from open`}
          tradingTip="Monitor price action relative to key support and resistance levels"
        />
        <InfoCard
          title="24h Volume"
          shortDescription={`${(latestData?.volume / 1000000 || 0).toFixed(1)}M volume traded`}
          detailedExplanation="High volume indicates strong market participation and validates price movements"
          tradingTip="Volume spikes often precede significant price moves"
        />
        <InfoCard
          title="Price Z-Score"
          shortDescription={`${currentPriceZScore.toFixed(2)} - ${priceZScoreSignal.signal}`}
          detailedExplanation={priceZScoreSignal.description}
          tradingTip="Extreme Z-scores (>2.5 or <-2.5) often signal potential reversals"
        />
        <InfoCard
          title="Volume Z-Score"
          shortDescription={`${currentVolumeZScore.toFixed(2)} - ${volumeZScoreSignal.signal}`}
          detailedExplanation={volumeZScoreSignal.description}
          tradingTip="High volume Z-scores confirm price moves, low volume suggests weak signals"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="charts">Technical Charts</TabsTrigger>
          <TabsTrigger value="analysis">Cycle Analysis</TabsTrigger>
          <TabsTrigger value="news">Market News</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          {/* Price Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Bitcoin Price Chart
              </CardTitle>
              <CardDescription>
                Real-time price action with technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} />
                    {indicators.sma && <Line type="monotone" dataKey="sma20" stroke="#10b981" strokeWidth={1} dot={false} />}
                    {indicators.ema && <Line type="monotone" dataKey="ema20" stroke="#f59e0b" strokeWidth={1} dot={false} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RSI Chart */}
            {indicators.rsi && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    RSI (14)
                  </CardTitle>
                  <CardDescription>
                    Current: {currentRSI?.toFixed(2) || 'N/A'} - 
                    {currentRSI > 70 ? ' Overbought' : currentRSI < 30 ? ' Oversold' : ' Neutral'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        <ReferenceLine y={70} stroke="red" strokeDasharray="5 5" />
                        <ReferenceLine y={30} stroke="green" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MACD Chart */}
            {indicators.macd && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    MACD
                  </CardTitle>
                  <CardDescription>
                    Current: {currentMACD?.toFixed(2) || 'N/A'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="macdSignal" stroke="#ef4444" strokeWidth={1} dot={false} />
                        <ReferenceLine y={0} stroke="gray" strokeDasharray="2 2" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Z-Score Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Statistical Z-Score Analysis
              </CardTitle>
              <CardDescription>
                Statistical deviation analysis for price and volume patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Z-Score Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    Price Z-Score
                    <Badge variant="outline" className={priceZScoreSignal.color}>
                      {priceZScoreSignal.signal}
                    </Badge>
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">{priceZScoreSignal.description}</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis domain={[-3, 3]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="priceZScore" stroke="#2563eb" strokeWidth={2} dot={false} />
                        <ReferenceLine y={2.5} stroke="red" strokeDasharray="5 5" label="Extremely High" />
                        <ReferenceLine y={2} stroke="orange" strokeDasharray="5 5" label="High" />
                        <ReferenceLine y={0} stroke="gray" strokeDasharray="2 2" label="Average" />
                        <ReferenceLine y={-2} stroke="blue" strokeDasharray="5 5" label="Low" />
                        <ReferenceLine y={-2.5} stroke="green" strokeDasharray="5 5" label="Extremely Low" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Volume Z-Score Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    Volume Z-Score
                    <Badge variant="outline" className={volumeZScoreSignal.color}>
                      {volumeZScoreSignal.signal}
                    </Badge>
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">{volumeZScoreSignal.description}</p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" />
                        <YAxis domain={[-3, 3]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="volumeZScore" stroke="#10b981" strokeWidth={2} dot={false} />
                        <ReferenceLine y={2.5} stroke="red" strokeDasharray="5 5" label="Extremely High" />
                        <ReferenceLine y={2} stroke="orange" strokeDasharray="5 5" label="High" />
                        <ReferenceLine y={0} stroke="gray" strokeDasharray="2 2" label="Average" />
                        <ReferenceLine y={-2} stroke="blue" strokeDasharray="5 5" label="Low" />
                        <ReferenceLine y={-2.5} stroke="green" strokeDasharray="5 5" label="Extremely Low" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Indicators Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Technical Indicators Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">RSI Analysis</h4>
                  <p className="text-2xl font-bold text-blue-600">{currentRSI?.toFixed(2) || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    {currentRSI > 70 ? 'Overbought - Consider selling' : 
                     currentRSI < 30 ? 'Oversold - Consider buying' : 
                     'Neutral - No clear signal'}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Price Z-Score</h4>
                  <p className={`text-2xl font-bold ${priceZScoreSignal.color}`}>
                    {currentPriceZScore.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">{priceZScoreSignal.description}</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Volume Z-Score</h4>
                  <p className={`text-2xl font-bold ${volumeZScoreSignal.color}`}>
                    {currentVolumeZScore.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">{volumeZScoreSignal.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <CycleAnalysisPanel 
            cycles={[]}
            cycleStrength={0}
            isVisible={true}
          />
        </TabsContent>

        <TabsContent value="news">
          <NewsSection symbol="BTCUSDT" />
        </TabsContent>

        <TabsContent value="education">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Analysis Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">RSI (Relative Strength Index)</h4>
                  <p className="text-sm text-gray-600">
                    Measures momentum. Values above 70 suggest overbought conditions, 
                    while values below 30 suggest oversold conditions.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">MACD (Moving Average Convergence Divergence)</h4>
                  <p className="text-sm text-gray-600">
                    Shows the relationship between two moving averages. 
                    Crossovers can signal potential trend changes.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Moving Averages</h4>
                  <p className="text-sm text-gray-600">
                    Smoothed price data that helps identify trends. 
                    Price above MA suggests uptrend, below suggests downtrend.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistical Analysis Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Z-Score Analysis</h4>
                  <p className="text-sm text-gray-600">
                    Measures how many standard deviations a value is from the average. 
                    Helps identify statistical extremes and potential reversal points.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Z-Score Interpretation</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• |Z| > 2.5: Extreme deviation (strong reversal signal)</li>
                    <li>• |Z| > 2.0: Significant deviation (moderate signal)</li>
                    <li>• |Z| > 1.0: Minor deviation</li>
                    <li>• |Z| ≤ 1.0: Normal range</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Volume Z-Score</h4>
                  <p className="text-sm text-gray-600">
                    High volume Z-scores often confirm price movements, 
                    while low volume suggests weak conviction in price moves.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradingDashboard;
