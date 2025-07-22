import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity, BookOpen, Brain, Frown, Smile, Meh, BarChart3, TrendingUp as StatisticsIcon, Bot, ExternalLink, AlertCircle } from 'lucide-react';
import AIRecommendationSection from './AIRecommendationSection';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import InfoCard from './InfoCard';
import TimeRangeSelector from './TimeRangeSelector';
import ChartControls from './ChartControls';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import NewsSection from './NewsSection';
import CycleProjectionModal from './CycleProjectionModal';
import MACDChart from './MACDChart';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';
import ROCChart from './ROCChart';
import StochasticChart from './StochasticChart';
import { analyzeCycles, generateCycleProjections, calculateCycleStrength, CyclePeak } from '../utils/cycleAnalysis';
import { useFearGreedIndex } from '../hooks/useFearGreedIndex';
import { useM2GlobalData } from '../hooks/useM2GlobalData';


const TradingDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1d');
  const [timeRange, setTimeRange] = useState('60');
  const [showEducation, setShowEducation] = useState(false);
  const [selectedCycleModal, setSelectedCycleModal] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'technical' | 'ai-trade' | 'news-sentiment'>('overview');

  // Chart zoom and display controls
  const [yAxisPadding, setYAxisPadding] = useState(10);
  const [autoFit, setAutoFit] = useState(true);
  const [manualPriceRange, setManualPriceRange] = useState({ min: 0, max: 0 });
  const [chartHeight, setChartHeight] = useState(400);
  const [visibleLines, setVisibleLines] = useState({
    price: true,
    sma20: true,
    sma50: false,
    sma200: false,
    ema20: false,
    ema50: false,
    bbUpper: true,
    bbLower: true,
    vwap: false,
    cycle0: false,
    cycle1: false,
    cycle2: false
  });

  // Cycle analysis state
  const [showCycleAnalysis, setShowCycleAnalysis] = useState(false);

  // Fear and Greed Index
  const { data: fearGreedData, loading: fearGreedLoading, error: fearGreedError, refetch: refetchFearGreed } = useFearGreedIndex();

  // M2 Global Data
  const { data: m2Data, loading: m2Loading, error: m2Error } = useM2GlobalData();

  // Configuration
  const LOOKBACK_DAYS = 201;
  const SMA_PERIODS = [5, 20, 50, 100, 200];
  const EMA_PERIODS = [5, 20, 50, 100, 200];
  const BB_PERIOD = 20;
  const BB_MULTIPLIER = 2;
  const MACD_FAST = 12;
  const MACD_SLOW = 26;
  const MACD_SIGNAL = 9;
  const STOCH_K_PERIOD = 14;
  const STOCH_D_PERIOD = 3;
  const ADX_PERIOD = 14;
  const ZSCORE_PERIOD = 30;
  const CCI_PERIOD = 20;

  // Dynamic RSI period based on time range
  const getRSIPeriod = (timeRange: string) => {
    switch(timeRange) {
      case '7': return 7;
      case '30': return 30;
      case '60': return 60;
      case '90': return 90;
      case 'all': return 14; // default
      default: return 14;
    }
  };

  const RSI_PERIOD = getRSIPeriod(timeRange);

  // Helper function to calculate True Range
  const calculateTrueRange = (high, low, previousClose) => {
    const tr1 = high - low;
    const tr2 = Math.abs(high - previousClose);
    const tr3 = Math.abs(low - previousClose);
    return Math.max(tr1, tr2, tr3);
  };

  // Helper function to calculate ATR (Average True Range)
  const calculateATR = (candles, period) => {
    if (candles.length < period + 1) return null;
    
    let trueRanges = [];
    
    // Calculate true ranges
    for (let i = 1; i < candles.length; i++) {
      const high = parseFloat(candles[i][2]);
      const low = parseFloat(candles[i][3]);
      const previousClose = parseFloat(candles[i-1][4]);
      
      const tr = calculateTrueRange(high, low, previousClose);
      trueRanges.push(tr);
    }
    
    // Calculate ATR using simple moving average of true ranges
    if (trueRanges.length < period) return null;
    
    const recentTRs = trueRanges.slice(-period);
    const atr = recentTRs.reduce((sum, tr) => sum + tr, 0) / period;
    
    return atr;
  };

  // Helper function to calculate VWAP
  const calculateVWAP = (candles) => {
    if (candles.length === 0) return null;
    
    let totalVolume = 0;
    let totalVolumePrice = 0;
    
    for (let i = 0; i < candles.length; i++) {
      const high = parseFloat(candles[i][2]);
      const low = parseFloat(candles[i][3]);
      const close = parseFloat(candles[i][4]);
      const volume = parseFloat(candles[i][5]);
      
      // Typical price (HLC/3)
      const typicalPrice = (high + low + close) / 3;
      
      totalVolume += volume;
      totalVolumePrice += (typicalPrice * volume);
    }
    
    return totalVolume > 0 ? totalVolumePrice / totalVolume : null;
  };

  // Helper function to calculate VWAP for chart data (progressive calculation)
  const calculateVWAPArray = (candles) => {
    if (candles.length === 0) return [];
    
    const vwapArray = [];
    let cumulativeVolume = 0;
    let cumulativeVolumePrice = 0;
    
    for (let i = 0; i < candles.length; i++) {
      const high = parseFloat(candles[i][2]);
      const low = parseFloat(candles[i][3]);
      const close = parseFloat(candles[i][4]);
      const volume = parseFloat(candles[i][5]);
      
      // Typical price (HLC/3)
      const typicalPrice = (high + low + close) / 3;
      
      cumulativeVolume += volume;
      cumulativeVolumePrice += (typicalPrice * volume);
      
      const vwap = cumulativeVolume > 0 ? cumulativeVolumePrice / cumulativeVolume : null;
      vwapArray.push(vwap);
    }
    
    return vwapArray;
  };

  const calculateSMA = (prices, period, offset = 0) => {
    const startIndex = prices.length - period - offset;
    const endIndex = prices.length - offset;
    
    if (startIndex < 0) return null;
    
    const recentPrices = prices.slice(startIndex, endIndex);
    const sum = recentPrices.reduce((total, price) => total + price, 0);
    return sum / period;
  };

  const calculateEMA = (prices, period) => {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  };

  const calculateEMAArray = (prices, period) => {
    if (prices.length < period) return null;
    
    const multiplier = 2 / (period + 1);
    const emaArray = [];
    let ema = prices[0];
    emaArray.push(ema);
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
      emaArray.push(ema);
    }
    
    return emaArray;
  };

  const calculateRSI = (prices, period) => {
    if (prices.length < period + 1) return null;
    
    let gains = [];
    let losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;
    
    for (let i = period; i < gains.length; i++) {
      avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
      avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
    }
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateStandardDeviation = (prices, period) => {
    if (prices.length < period) return null;
    
    const recentPrices = prices.slice(-period);
    const mean = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    const variance = recentPrices.reduce((sum, price) => {
      const diff = price - mean;
      return sum + (diff * diff);
    }, 0) / period;
    
    return Math.sqrt(variance);
  };

  const calculateMACD = (prices, fastPeriod, slowPeriod, signalPeriod) => {
    if (prices.length < slowPeriod) return null;
    
    const ema12Array = calculateEMAArray(prices, fastPeriod);
    const ema26Array = calculateEMAArray(prices, slowPeriod);
    
    if (!ema12Array || !ema26Array) return null;
    
    const macdArray = [];
    for (let i = slowPeriod - 1; i < ema12Array.length; i++) {
      macdArray.push(ema12Array[i] - ema26Array[i]);
    }
    
    const signalArray = calculateEMAArray(macdArray, signalPeriod);
    
    if (!signalArray || signalArray.length === 0) return null;
    
    const currentMACD = macdArray[macdArray.length - 1];
    const currentSignal = signalArray[signalArray.length - 1];
    const currentHistogram = currentMACD - currentSignal;
    
    const previousMACD = macdArray.length > 1 ? macdArray[macdArray.length - 2] : null;
    const previousSignal = signalArray.length > 1 ? signalArray[signalArray.length - 2] : null;
    
    let macdSignal = "none";
    if (previousMACD && previousSignal) {
      const currentAbove = currentMACD > currentSignal;
      const previousAbove = previousMACD > previousSignal;
      
      if (!previousAbove && currentAbove) {
        macdSignal = "bullish_crossover";
      } else if (previousAbove && !currentAbove) {
        macdSignal = "bearish_crossover";
      }
    }
    
    return {
      macd: currentMACD,
      signal: currentSignal,
      histogram: currentHistogram,
      crossover: macdSignal,
      macdArray,
      signalArray
    };
  };

  // Helper function to calculate Stochastic Oscillator
  const calculateStochastic = (candles, kPeriod, dPeriod) => {
    if (candles.length < kPeriod) return null;
    
    const recentCandles = candles.slice(-kPeriod);
    
    // Get highest high and lowest low over the period
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    
    for (let i = 0; i < recentCandles.length; i++) {
      const high = parseFloat(recentCandles[i][2]);
      const low = parseFloat(recentCandles[i][3]);
      
      if (high > highestHigh) highestHigh = high;
      if (low < lowestLow) lowestLow = low;
    }
    
    const currentClose = parseFloat(candles[candles.length - 1][4]);
    
    // Calculate %K
    const stochK = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    return { stochK, highestHigh, lowestLow };
  };

  // Helper function to calculate Stochastic Array for chart
  const calculateStochasticArray = (candles, kPeriod, dPeriod) => {
    if (candles.length < kPeriod + dPeriod) return null;
    
    const stochKArray = [];
    
    // Calculate %K for each period
    for (let i = kPeriod - 1; i < candles.length; i++) {
      const periodCandles = candles.slice(i - kPeriod + 1, i + 1);
      
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      
      for (let j = 0; j < periodCandles.length; j++) {
        const high = parseFloat(periodCandles[j][2]);
        const low = parseFloat(periodCandles[j][3]);
        
        if (high > highestHigh) highestHigh = high;
        if (low < lowestLow) lowestLow = low;
      }
      
      const currentClose = parseFloat(candles[i][4]);
      const stochK = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      stochKArray.push(stochK);
    }
    
    // Calculate %D (SMA of %K)
    const stochDArray = [];
    for (let i = dPeriod - 1; i < stochKArray.length; i++) {
      const dPeriodK = stochKArray.slice(i - dPeriod + 1, i + 1);
      const stochD = dPeriodK.reduce((sum, k) => sum + k, 0) / dPeriod;
      stochDArray.push(stochD);
    }
    
    return {
      stochK: stochKArray[stochKArray.length - 1],
      stochD: stochDArray[stochDArray.length - 1],
      stochKArray,
      stochDArray
    };
  };

  // Helper function to calculate ADX (Average Directional Index)
  const calculateADX = (candles, period) => {
    if (candles.length < period + 1) return null;
    
    const trArray = [];
    const plusDMArray = [];
    const minusDMArray = [];
    
    // Calculate True Range, +DM, and -DM
    for (let i = 1; i < candles.length; i++) {
      const high = parseFloat(candles[i][2]);
      const low = parseFloat(candles[i][3]);
      const close = parseFloat(candles[i][4]);
      const prevHigh = parseFloat(candles[i-1][2]);
      const prevLow = parseFloat(candles[i-1][3]);
      const prevClose = parseFloat(candles[i-1][4]);
      
      // True Range
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      const tr = Math.max(tr1, tr2, tr3);
      trArray.push(tr);
      
      // Directional Movement
      const highDiff = high - prevHigh;
      const lowDiff = prevLow - low;
      
      const plusDM = (highDiff > lowDiff && highDiff > 0) ? highDiff : 0;
      const minusDM = (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0;
      
      plusDMArray.push(plusDM);
      minusDMArray.push(minusDM);
    }
    
    if (trArray.length < period) return null;
    
    // Calculate smoothed averages
    let atr = trArray.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
    let plusDI = plusDMArray.slice(0, period).reduce((sum, dm) => sum + dm, 0) / period;
    let minusDI = minusDMArray.slice(0, period).reduce((sum, dm) => sum + dm, 0) / period;
    
    // Smooth the values (Wilder's smoothing)
    for (let i = period; i < trArray.length; i++) {
      atr = ((atr * (period - 1)) + trArray[i]) / period;
      plusDI = ((plusDI * (period - 1)) + plusDMArray[i]) / period;
      minusDI = ((minusDI * (period - 1)) + minusDMArray[i]) / period;
    }
    
    // Calculate DI+ and DI-
    const plusDIPercent = (plusDI / atr) * 100;
    const minusDIPercent = (minusDI / atr) * 100;
    
    // Calculate DX
    const dx = Math.abs(plusDIPercent - minusDIPercent) / (plusDIPercent + minusDIPercent) * 100;
    
    return {
      adx: dx,
      plusDI: plusDIPercent,
      minusDI: minusDIPercent
    };
  };

  // CCI FUNCTIONS
  // Helper function to calculate Commodity Channel Index (CCI)
  const calculateCCI = (candles, period) => {
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
    const cci = (currentTP - smaTP) / (0.015 * meanDeviation);
     
    return cci;
  };

  // Helper function to calculate CCI array for charting
  const calculateCCIArray = (candles, period) => {
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
  const getCCISignal = (cci) => {
    if (cci === null) return "Unknown";
    if (cci > 100) return "Overbought";
    if (cci < -100) return "Oversold";
    return "Neutral";
  };

  // ROC CALCULATION FUNCTIONS
  // Helper function to calculate ROC array for charting
  const calculateROCArray = (candles, period) => {
    if (candles.length < period + 1) return [];
    
    const rocArray = [];
    
    for (let i = period; i < candles.length; i++) {
      const todayClose = parseFloat(candles[i][4]);
      const nDaysAgoClose = parseFloat(candles[i - period][4]);
      
      // ROC calculation: ((today's closing - closing price n days ago) / closing price n days ago) * 100
      const roc = nDaysAgoClose !== 0 ? ((todayClose - nDaysAgoClose) / nDaysAgoClose) * 100 : 0;
      
      rocArray.push(roc);
    }
    
    return rocArray;
  };

  // NEW Z-SCORE FUNCTIONS
  const calculateZScore = (values, period) => {
    if (values.length < period) return null;
    
    const recentValues = values.slice(-period);
    const mean = recentValues.reduce((sum, val) => sum + val, 0) / period;
    
    const variance = recentValues.reduce((sum, val) => {
      const diff = val - mean;
      return sum + (diff * diff);
    }, 0) / period;
    
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const currentValue = values[values.length - 1];
    const zScore = (currentValue - mean) / stdDev;
    
    return zScore;
  };

  const calculateZScoreArray = (values, period) => {
    if (values.length < period) return [];
    
    const zScores = [];
    
    for (let i = period - 1; i < values.length; i++) {
      const periodValues = values.slice(i - period + 1, i + 1);
      const mean = periodValues.reduce((sum, val) => sum + val, 0) / period;
      
      const variance = periodValues.reduce((sum, val) => {
        const diff = val - mean;
        return sum + (diff * diff);
      }, 0) / period;
      
      const stdDev = Math.sqrt(variance);
      
      if (stdDev === 0) {
        zScores.push(0);
      } else {
        const zScore = (values[i] - mean) / stdDev;
        zScores.push(zScore);
      }
    }
    
    return zScores;
  };

  const getZScoreSignal = (zScore) => {
    if (zScore === null) return "Unknown";
    if (zScore > 2) return "Extremely High";
    if (zScore > 1) return "High";
    if (zScore > -1) return "Normal";
    if (zScore > -2) return "Low";
    return "Extremely Low";
  };

  const fetchBinanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${LOOKBACK_DAYS}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setRawData(data);
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Error fetching Binance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredChartData = (chartData) => {
    if (timeRange === 'all') return chartData;
    
    const daysToShow = parseInt(timeRange);
    return chartData.slice(-daysToShow);
  };

  const calculateYAxisDomain = (data, padding = 10) => {
    if (!data || data.length === 0) return ['auto', 'auto'];
    
    const prices = data.map(d => d.price).filter(p => p != null);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    const paddingAmount = (range * padding) / 100;
    
    return [min - paddingAmount, max + paddingAmount];
  };

  const handleYAxisPaddingChange = (padding) => {
    setYAxisPadding(padding);
  };

  const handleAutoFitChange = (enabled) => {
    setAutoFit(enabled);
  };

  const handlePriceRangeChange = (min, max) => {
    setManualPriceRange({ min, max });
  };

  const handleLineVisibilityChange = (line, visible) => {
    setVisibleLines(prev => ({ ...prev, [line]: visible }));
  };

  const handleZoomIn = () => {
    setYAxisPadding(Math.max(0, yAxisPadding - 5));
  };

  const handleZoomOut = () => {
    setYAxisPadding(Math.min(25, yAxisPadding + 5));
  };

  const handleResetZoom = () => {
    setYAxisPadding(10);
    setAutoFit(true);
    setManualPriceRange({ min: 0, max: 0 });
  };

  const handleFocusRecent = () => {
    setTimeRange('7');
    setYAxisPadding(5);
    setAutoFit(true);
  };

  // Helper function to correlate M2 data with price data
  const correlateM2WithPriceData = (priceData: any[], m2Data: any[]) => {
    if (!m2Data || m2Data.length === 0) {
      console.log('No M2 data available for correlation');
      return priceData;
    }

    console.log('Correlating M2 data:', { m2DataLength: m2Data.length, priceDataLength: priceData.length });

    // Create a map of M2 data by date for efficient lookup
    const m2Map = new Map();
    m2Data.forEach(item => {
      const date = new Date(item.date).toISOString().split('T')[0];
      m2Map.set(date, item.m2Supply);
    });

    console.log('M2 data map size:', m2Map.size);

    // Add M2 data to price data where dates match
    const correlatedData = priceData.map(item => {
      const m2Supply = m2Map.get(item.date);
      return {
        ...item,
        m2Supply: m2Supply || null
      };
    });

    const m2MatchCount = correlatedData.filter(item => item.m2Supply !== null).length;
    console.log('M2 correlation results:', { totalPricePoints: priceData.length, m2Matches: m2MatchCount });

    return correlatedData;
  };

  // Helper function to format M2 supply values
  const formatM2Supply = (value: number) => {
    if (value === null || value === undefined) return 'N/A';
    
    const trillion = 1000000000000;
    const billion = 1000000000;
    
    if (value >= trillion) {
      return `$${(value / trillion).toFixed(2)}T`;
    } else if (value >= billion) {
      return `$${(value / billion).toFixed(2)}B`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return { chartData: [], indicators: null, cycles: [], cycleStrength: 0, cycleProjections: [] };

    const prices = rawData.map(candle => parseFloat(candle[4]));
    const volumes = rawData.map(candle => parseFloat(candle[5]));
    
    if (prices.length < LOOKBACK_DAYS) {
      return { chartData: [], indicators: null, cycles: [], cycleStrength: 0, cycleProjections: [] };
    }

    // STEP 1: Calculate ALL indicators on the FULL 201-day dataset FIRST
    const fullSMA20Array = [];
    const fullSMA50Array = [];
    const fullSMA200Array = [];
    const fullEMA20Array = [];
    const fullEMA50Array = [];
    const fullEMA200Array = [];
    const fullBBMidArray = [];
    const fullBBUpArray = [];
    const fullBBLowArray = [];
    const fullRSIArray = [];
    const fullATRArray = [];
    
    // Calculate indicators for the full dataset
    for (let i = 0; i < rawData.length; i++) {
      const pricesUpToThis = prices.slice(0, i + 1);
      const candlesUpToThis = rawData.slice(0, i + 1);
      
      fullSMA20Array.push(calculateSMA(pricesUpToThis, 20));
      fullSMA50Array.push(calculateSMA(pricesUpToThis, 50));
      fullSMA200Array.push(calculateSMA(pricesUpToThis, 200));
      fullEMA20Array.push(calculateEMA(pricesUpToThis, 20));
      fullEMA50Array.push(calculateEMA(pricesUpToThis, 50));
      fullEMA200Array.push(calculateEMA(pricesUpToThis, 200));
      fullRSIArray.push(calculateRSI(pricesUpToThis, RSI_PERIOD));
      fullATRArray.push(calculateATR(candlesUpToThis, 14));
      
      const bbMid = calculateSMA(pricesUpToThis, BB_PERIOD);
      const bbStd = calculateStandardDeviation(pricesUpToThis, BB_PERIOD);
      fullBBMidArray.push(bbMid);
      fullBBUpArray.push(bbMid !== null && bbStd !== null ? bbMid + (BB_MULTIPLIER * bbStd) : null);
      fullBBLowArray.push(bbMid !== null && bbStd !== null ? bbMid - (BB_MULTIPLIER * bbStd) : null);
    }

    // Calculate current indicators for summary (using last values)
    const currentSMAs: Record<string, number | null> = {};
    SMA_PERIODS.forEach(period => {
      currentSMAs[`sma${period}`] = calculateSMA(prices, period, 0);
    });

    const currentEMAs: Record<string, number | null> = {};
    EMA_PERIODS.forEach(period => {
      currentEMAs[`ema${period}`] = calculateEMA(prices, period);
    });

    const yesterdaySMA50 = calculateSMA(prices, 50, 1);
    const yesterdaySMA200 = calculateSMA(prices, 200, 1);
    const currentRSI = calculateRSI(prices, RSI_PERIOD);
    
    const bbMiddle = calculateSMA(prices, BB_PERIOD);
    const bbStdDev = calculateStandardDeviation(prices, BB_PERIOD);
    const bbUpper = bbMiddle !== null && bbStdDev !== null ? bbMiddle + (BB_MULTIPLIER * bbStdDev) : null;
    const bbLower = bbMiddle !== null && bbStdDev !== null ? bbMiddle - (BB_MULTIPLIER * bbStdDev) : null;
    
    const macdResult = calculateMACD(prices, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
    
    const currentATR = calculateATR(rawData, 14);
    const currentVWAP = calculateVWAP(rawData);
    
    const stochasticResult = calculateStochasticArray(rawData, STOCH_K_PERIOD, STOCH_D_PERIOD);
    
    const adxResult = calculateADX(rawData, ADX_PERIOD);

    // CCI calculation
    const currentCCI = calculateCCI(rawData, CCI_PERIOD);
    const cciSignal = getCCISignal(currentCCI);

    // Z-SCORE CALCULATIONS
    const priceZScore = calculateZScore(prices, ZSCORE_PERIOD);
    const volumeZScore = calculateZScore(volumes, ZSCORE_PERIOD);
    
    // Calculate RSI array for Z-score calculation
    const rsiArray = [];
    for (let i = RSI_PERIOD; i < prices.length; i++) {
      const slicePrices = prices.slice(0, i + 1);
      const rsiValue = calculateRSI(slicePrices, RSI_PERIOD);
      if (rsiValue !== null) rsiArray.push(rsiValue);
    }
    const rsiZScore = rsiArray.length >= ZSCORE_PERIOD ? calculateZScore(rsiArray, ZSCORE_PERIOD) : null;
    
    // Calculate ATR array for Z-score calculation
    const atrArray = [];
    for (let i = 14; i < rawData.length; i++) {
      const sliceCandles = rawData.slice(0, i + 1);
      const atrValue = calculateATR(sliceCandles, 14);
      if (atrValue !== null) atrArray.push(atrValue);
    }
    const atrZScore = atrArray.length >= ZSCORE_PERIOD ? calculateZScore(atrArray, ZSCORE_PERIOD) : null;

    const currentPrice = prices[prices.length - 1];
    
    const currentAbove = (currentSMAs.sma50 && currentSMAs.sma200) ? currentSMAs.sma50 > currentSMAs.sma200 : false;
    const previousAbove = (yesterdaySMA50 && yesterdaySMA200) ? yesterdaySMA50 > yesterdaySMA200 : false;
    
    let crossSignal = "none";
    if (!previousAbove && currentAbove) {
      crossSignal = "golden_cross";
    } else if (previousAbove && !currentAbove) {
      crossSignal = "death_cross";
    }

    let rsiSignal;
    if (currentRSI !== null) {
      if (currentRSI < 30) {
        rsiSignal = "Oversold";
      } else if (currentRSI > 70) {
        rsiSignal = "Overbought";
      } else {
        rsiSignal = "Neutral";
      }
    } else {
      rsiSignal = "Neutral";
    }

    let stochSignal = "Neutral";
    if (stochasticResult) {
      if (stochasticResult.stochK < 20 && stochasticResult.stochD < 20) {
        stochSignal = "Oversold";
      } else if (stochasticResult.stochK > 80 && stochasticResult.stochD > 80) {
        stochSignal = "Overbought";
      }
    }

    let trendStrength = "Unknown";
    if (adxResult) {
      if (adxResult.adx > 25) {
        trendStrength = "Strong Trend";
      } else if (adxResult.adx > 20) {
        trendStrength = "Moderate Trend";
      } else {
        trendStrength = "Weak/Ranging";
      }
    }

    const priceAboveSMA20 = currentPrice > currentSMAs.sma20;
    const priceAboveSMA50 = currentPrice > currentSMAs.sma50;
    const priceAboveSMA200 = currentPrice > currentSMAs.sma200;
    const priceAboveEMA20 = currentPrice > currentEMAs.ema20;
    const priceAboveEMA50 = currentPrice > currentEMAs.ema50;
    const priceAboveVWAP = currentPrice > currentVWAP;
    const sma20AboveSMA50 = currentSMAs.sma20 > currentSMAs.sma50;
    const sma50AboveSMA200 = currentSMAs.sma50 > currentSMAs.sma200;
    const priceNearBBLower = currentPrice < (bbLower + (bbMiddle - bbLower) * 0.1);

    let bullishScore = 0;
    if (priceAboveSMA20) bullishScore++;
    if (priceAboveSMA50) bullishScore++;
    if (priceAboveSMA200) bullishScore++;
    if (priceAboveEMA20) bullishScore++;
    if (priceAboveEMA50) bullishScore++;
    if (priceAboveVWAP) bullishScore++;
    if (sma20AboveSMA50) bullishScore++;
    if (sma50AboveSMA200) bullishScore++;
    if (crossSignal === "golden_cross") bullishScore++;
    if (rsiSignal === "Oversold") bullishScore++;
    if (priceNearBBLower) bullishScore++;
    if (macdResult && macdResult.crossover === "bullish_crossover") bullishScore++;
    if (stochSignal === "Oversold") bullishScore++;

    let marketSentiment;
    if (bullishScore >= 8) marketSentiment = "bullish";
    else if (bullishScore <= 3) marketSentiment = "bearish";
    else marketSentiment = "neutral";

    // STEP 2: Now prepare chart data for the selected time window
    // Convert timeRange to actual number of days to show
    const getDaysToShow = (timeRange: string) => {
      switch(timeRange) {
        case '7': return 7;
        case '30': return 30;
        case '60': return 60;
        case '90': return 90;
        case 'all': return rawData.length;
        default: return 60;
      }
    };
    
    const daysToShow = getDaysToShow(timeRange);
    const chartDataSlice = rawData.slice(-daysToShow);
    
    const vwapArray = calculateVWAPArray(chartDataSlice);
    const priceZScoreArray = calculateZScoreArray(prices, ZSCORE_PERIOD);
    const volumeZScoreArray = calculateZScoreArray(volumes, ZSCORE_PERIOD);
    const cciArray = calculateCCIArray(rawData, CCI_PERIOD);
    const rocArray = calculateROCArray(rawData, CCI_PERIOD); // Using same period as CCI (20)
    
    let chartData = chartDataSlice.map((candle, index) => {
      const timestamp = parseInt(candle[0]);
      const price = parseFloat(candle[4]);
      const volume = parseFloat(candle[5]);
      const date = new Date(timestamp);
      
      // Use pre-calculated indicators from the full dataset
      const fullDataIndex = rawData.length - daysToShow + index;
      
      const sma20 = fullSMA20Array[fullDataIndex];
      const sma50 = fullSMA50Array[fullDataIndex];
      const sma200 = fullSMA200Array[fullDataIndex];
      const ema20 = fullEMA20Array[fullDataIndex];
      const ema50 = fullEMA50Array[fullDataIndex];
      const ema200 = fullEMA200Array[fullDataIndex];
      const rsi = fullRSIArray[fullDataIndex];
      const atr = fullATRArray[fullDataIndex];
      
      const bbMid = fullBBMidArray[fullDataIndex];
      const bbUp = fullBBUpArray[fullDataIndex];
      const bbLow = fullBBLowArray[fullDataIndex];
      
      // Calculate additional indicators that need current context
      const pricesUpToThis = prices.slice(0, fullDataIndex + 1);
      const candlesUpToThis = rawData.slice(0, fullDataIndex + 1);
      
      let macd = null, macdSig = null, macdHist = null;
      if (pricesUpToThis.length >= MACD_SLOW) {
        const macdRes = calculateMACD(pricesUpToThis, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
        if (macdRes) {
          macd = macdRes.macd;
          macdSig = macdRes.signal;
          macdHist = macdRes.histogram;
        }
      }

      // Stochastic for this point
      const stochPoint = calculateStochastic(candlesUpToThis, STOCH_K_PERIOD, STOCH_D_PERIOD);
      const stochArrayPoint = calculateStochasticArray(candlesUpToThis, STOCH_K_PERIOD, STOCH_D_PERIOD);
      
      // ADX for this point
      const adxPoint = calculateADX(candlesUpToThis, ADX_PERIOD);

      // CCI for this point
      const cciIndex = fullDataIndex - (CCI_PERIOD - 1);
      const cciValue = cciIndex >= 0 && cciIndex < cciArray.length ? cciArray[cciIndex] : null;

      // ROC for this point
      const rocIndex = fullDataIndex - CCI_PERIOD; // ROC needs one extra day for calculation
      const rocValue = rocIndex >= 0 && rocIndex < rocArray.length ? rocArray[rocIndex] : null;

      return {
        date: date.toISOString().split('T')[0],
        timestamp: timestamp,
        price: price,
        volume: volume,
        sma20: sma20,
        sma50: sma50,
        sma200: sma200,
        ema20: ema20,
        ema50: ema50,
        ema200: ema200,
        bbUpper: bbUp,
        bbMiddle: bbMid,
        bbLower: bbLow,
        rsi: rsi,
        cci: cciValue,
        roc: rocValue,
        macd: macd,
        macdSignal: macdSig,
        macdHistogram: macdHist,
        atr: atr,
        vwap: vwapArray[index],
        stochK: stochArrayPoint ? stochArrayPoint.stochK : null,
        stochD: stochArrayPoint ? stochArrayPoint.stochD : null,
        adx: adxPoint ? adxPoint.adx : null,
        priceZScore: priceZScoreArray.length > index ? priceZScoreArray[priceZScoreArray.length - daysToShow + index] : null,
        volumeZScore: volumeZScoreArray.length > index ? volumeZScoreArray[volumeZScoreArray.length - daysToShow + index] : null
      };
    });

    // Correlate M2 data with price data
    chartData = correlateM2WithPriceData(chartData, m2Data);

    const indicators = {
      ...currentSMAs,
      ...currentEMAs,
      currentPrice,
      bbUpper,
      bbMiddle,
      bbLower,
      rsi: currentRSI,
      rsiSignal,
      macd: macdResult?.macd || null,
      macdSignal: macdResult?.signal || null,
      macdHistogram: macdResult?.histogram || null,
      macdCrossover: macdResult?.crossover || null,
      atr: currentATR,
      vwap: currentVWAP,
      stochK: stochasticResult?.stochK || null,
      stochD: stochasticResult?.stochD || null,
      stochSignal,
      adx: adxResult?.adx || null,
      plusDI: adxResult?.plusDI || null,
      minusDI: adxResult?.minusDI || null,
      trendStrength,
      bullishScore,
      marketSentiment,
      crossSignal,
      cci: currentCCI,
      cciSignal,
      priceAboveSMA20,
      priceAboveSMA50,
      priceAboveSMA200,
      priceAboveEMA20,
      priceAboveEMA50,
      priceAboveVWAP,
      sma50: currentSMAs.sma50,
      sma200: currentSMAs.sma200,
      rsiPeriod: RSI_PERIOD,
      priceZScore,
      volumeZScore,
      rsiZScore,
      atrZScore,
      priceZScoreSignal: getZScoreSignal(priceZScore),
      volumeZScoreSignal: getZScoreSignal(volumeZScore),
      rsiZScoreSignal: getZScoreSignal(rsiZScore),
      atrZScoreSignal: getZScoreSignal(atrZScore)
    };

    // Cycle analysis
    const cyclePrices = chartData.map(d => d.price);
    const cycles = showCycleAnalysis ? analyzeCycles(cyclePrices) : [];
    const cycleStrength = calculateCycleStrength(cycles);
    const cycleProjections = showCycleAnalysis && cycles.length > 0 
      ? generateCycleProjections(chartData, cycles) 
      : [];

    if (showCycleAnalysis && cycles.length > 0) {
      console.log('Cycle Analysis Results:', {
        cycleCount: cycles.length,
        cycleStrength,
        topCycles: cycles.slice(0, 3),
        projectionCount: cycleProjections.length
      });
    }

    let extendedChartData = [...chartData];
    
    if (showCycleAnalysis && cycleProjections.length > 0) {
      const projectionsByTimestamp = cycleProjections.reduce((acc, proj) => {
        if (!acc[proj.timestamp]) {
          acc[proj.timestamp] = {
            date: new Date(proj.timestamp).toISOString().split('T')[0],
            timestamp: proj.timestamp,
            price: null,
            volume: null,
            sma20: null,
            sma50: null,
            ema20: null,
            ema50: null,
            bbUpper: null,
            bbMiddle: null,
            bbLower: null,
            rsi: null,
            macd: null,
            macdSignal: null,
            macdHistogram: null,
            atr: null,
            vwap: null,
            isProjection: true,
            cycle0: null,
            cycle1: null,
            cycle2: null
          };
        }
        
        const basePrice = chartData[chartData.length - 1].price;
        if (proj.cycleId === 'cycle-0' && Math.abs(proj.value) > basePrice * 0.001) {
          acc[proj.timestamp].cycle0 = basePrice + proj.value;
        }
        if (proj.cycleId === 'cycle-1' && Math.abs(proj.value) > basePrice * 0.001) {
          acc[proj.timestamp].cycle1 = basePrice + proj.value;
        }
        if (proj.cycleId === 'cycle-2' && Math.abs(proj.value) > basePrice * 0.001) {
          acc[proj.timestamp].cycle2 = basePrice + proj.value;
        }
        
        return acc;
      }, {});
      
      const projectionDataPoints = Object.values(projectionsByTimestamp) as any[];
      extendedChartData = [...chartData, ...projectionDataPoints];
    }

    return { chartData: extendedChartData, indicators, cycles, cycleStrength, cycleProjections };
  }, [rawData, showCycleAnalysis, timeRange, m2Data]);

  useEffect(() => {
    fetchBinanceData();
  }, [symbol, interval]);

  const getRSIDescription = (rsi) => {
    if (rsi < 30) return "Oversold";
    if (rsi > 70) return "Overbought";
    return "Neutral";
  };

  const getRSIColor = (rsi) => {
    if (rsi < 30) return 'text-bullish';
    if (rsi > 70) return 'text-bearish';
    return 'text-neutral';
  };

  const getFearGreedIcon = (classification) => {
    if (classification.toLowerCase().includes('fear')) return Frown;
    if (classification.toLowerCase().includes('greed')) return Smile;
    return Meh;
  };

  const getFearGreedColor = (classification) => {
    if (classification.toLowerCase().includes('fear')) return 'text-bearish';
    if (classification.toLowerCase().includes('greed')) return 'text-bullish';
    return 'text-neutral';
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPriceShort = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '';
    
    const num = Math.abs(value);
    
    if (num < 1000) {
      if (num < 1) {
        return `$${value.toFixed(4)}`;
      } else if (num < 10) {
        return `$${value.toFixed(2)}`;
      } else {
        return `$${Math.round(value)}`;
      }
    } else if (num < 1000000) {
      const kValue = value / 1000;
      if (kValue < 10) {
        return `$${kValue.toFixed(1)}k`;
      } else {
        return `$${Math.round(kValue)}k`;
      }
    } else {
      const mValue = value / 1000000;
      if (mValue < 10) {
        return `$${mValue.toFixed(1)}M`;
      } else {
        return `$${Math.round(mValue)}M`;
      }
    }
  };

  const formatDate = (value) => {
    return new Date(value).toLocaleDateString();
  };

  const getSentimentColor = (sentiment) => {
    switch(sentiment) {
      case 'bullish': return 'text-bullish';
      case 'bearish': return 'text-bearish';
      default: return 'text-neutral';
    }
  };

  const educationalContent = [
    {
      title: "Moving Averages (SMA/EMA)",
      shortDescription: "Trend direction and momentum indicators",
      detailedExplanation: "Simple Moving Average (SMA) calculates the average price over a specific period, while Exponential Moving Average (EMA) gives more weight to recent prices. They help identify trend direction and potential support/resistance levels.",
      tradingTip: "When price is above the moving average, it suggests an uptrend. Golden Cross (SMA 50 > SMA 200) is a bullish signal, while Death Cross is bearish."
    },
    {
      title: "RSI (Relative Strength Index)",
      shortDescription: "Momentum oscillator measuring overbought/oversold conditions",
      detailedExplanation: "RSI ranges from 0-100. Values above 70 typically indicate overbought conditions (potential sell signal), while values below 30 suggest oversold conditions (potential buy signal). RSI also shows momentum and can indicate trend strength.",
      tradingTip: "Look for RSI divergences with price action. If price makes new highs but RSI doesn't, it may signal weakening momentum."
    },
    {
      title: "MACD (Moving Average Convergence Divergence)",
      shortDescription: "Trend-following momentum indicator",
      detailedExplanation: "MACD consists of three components: MACD line (12 EMA - 26 EMA), Signal line (9 EMA of MACD), and Histogram (MACD - Signal). It helps identify trend changes and momentum shifts.",
      tradingTip: "Buy signals occur when MACD crosses above the signal line, and sell signals when it crosses below. The histogram shows the strength of the signal."
    },
    {
      title: "Bollinger Bands",
      shortDescription: "Volatility bands showing price channels",
      detailedExplanation: "Bollinger Bands consist of a middle line (20 SMA) and two outer bands (±2 standard deviations). They expand and contract based on market volatility, helping identify overbought/oversold conditions and potential breakouts.",
      tradingTip: "Prices tend to bounce between the bands. When bands squeeze together, it often precedes a significant price move."
    },
    {
      title: "Z-Score Analysis",
      shortDescription: "Statistical measure of how far a value deviates from the mean",
      detailedExplanation: "Z-Score measures how many standard deviations a current value is from the historical average. Values above +2 or below -2 indicate statistically extreme conditions that may signal reversals or continuation patterns.",
      tradingTip: "Use Z-scores to identify when prices, volume, or indicators are at extreme levels. High volume Z-scores confirm price moves, while extreme price Z-scores may signal reversal opportunities."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center shadow-card">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-foreground">Loading market data...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center shadow-card">
          <p className="text-destructive text-lg mb-4">{error}</p>
          <Button onClick={fetchBinanceData} className="bg-gradient-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const { chartData, indicators, cycles, cycleStrength, cycleProjections } = processedData;

  if (!indicators) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center shadow-card">
          <p className="text-lg text-foreground mb-4">Not enough data for technical analysis</p>
          <Button onClick={fetchBinanceData} className="bg-gradient-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </Card>
      </div>
    );
  }

  const filteredChartData = getFilteredChartData(chartData);
  const yAxisDomain = autoFit 
    ? calculateYAxisDomain(filteredChartData, yAxisPadding)
    : (manualPriceRange.min !== null && manualPriceRange.max !== null
        ? [manualPriceRange.min, manualPriceRange.max]
        : ['auto', 'auto']);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Yak Capital
            </h1>
            <p className="text-muted-foreground">Advanced trading dashboard with live market data</p>
            <p className="text-sm text-muted-foreground mt-1">Currently analyzing: {symbol}</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="BTCUSDT">BTC/USDT</option>
              <option value="ETHUSDT">ETH/USDT</option>
              <option value="ADAUSDT">ADA/USDT</option>
              <option value="SOLUSDT">SOL/USDT</option>
            </select>
            
            <select 
              value={interval} 
              onChange={(e) => setInterval(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
              <option value="1w">1 Week</option>
            </select>
            
            <Button 
              onClick={() => setShowEducation(!showEducation)}
              variant="outline"
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Learn
            </Button>
            
            <Button 
              onClick={() => {
                fetchBinanceData();
                refetchFearGreed();
              }}
              disabled={loading}
              className="bg-gradient-primary shadow-trading"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Educational Section */}
        <Collapsible open={showEducation} onOpenChange={setShowEducation}>
          <CollapsibleContent>
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Understanding Technical Indicators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {educationalContent.map((content, index) => (
                  <InfoCard
                    key={index}
                    title={content.title}
                    shortDescription={content.shortDescription}
                    detailedExplanation={content.detailedExplanation}
                    tradingTip={content.tradingTip}
                  />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Key Metrics Grid - Updated with Z-Score cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 shadow-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground">Current Price</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatPrice(indicators.currentPrice)}</p>
          </Card>
          

          


          <Card className="p-4 shadow-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <StatisticsIcon className="w-4 h-4 text-chart-2" />
              <UITooltip>
                <TooltipTrigger>
                  <h3 className="text-sm font-semibold text-muted-foreground cursor-help">Fear & Greed Index</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Bitcoin Fear & Greed Index shows market sentiment. 0-24: Extreme Fear, 25-49: Fear, 50-74: Greed, 75-100: Extreme Greed</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-foreground">
                {fearGreedData?.value || 'N/A'}
              </p>
              <span className={`text-sm font-medium ${
                !fearGreedData ? 'text-muted-foreground' :
                fearGreedData.value_classification === 'Extreme Fear' ? 'text-red-500' :
                fearGreedData.value_classification === 'Fear' ? 'text-orange-500' :
                fearGreedData.value_classification === 'Greed' ? 'text-green-500' :
                fearGreedData.value_classification === 'Extreme Greed' ? 'text-emerald-500' :
                'text-neutral'
              }`}>
                {fearGreedLoading ? 'Loading...' : 
                 fearGreedError ? 'Error' :
                 fearGreedData?.value_classification || 'N/A'}
              </span>
            </div>
          </Card>
        </div>

        {/* View Switcher */}
        <div className="mb-8 flex justify-center">
          <div className="bg-muted rounded-lg p-1 inline-flex">
            <Button
              variant={currentView === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('overview')}
              className={currentView === 'overview' ? 'bg-background shadow-sm text-foreground' : 'text-foreground hover:text-foreground'}
            >
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={currentView === 'technical' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('technical')}
              className={currentView === 'technical' ? 'bg-background shadow-sm text-foreground' : 'text-foreground hover:text-foreground'}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Technical Analysis
            </Button>
            <Button
              variant={currentView === 'ai-trade' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('ai-trade')}
              className={currentView === 'ai-trade' ? 'bg-background shadow-sm text-foreground' : 'text-foreground hover:text-foreground'}
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Trade of the Day
            </Button>
            <Button
              variant={currentView === 'news-sentiment' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('news-sentiment')}
              className={currentView === 'news-sentiment' ? 'bg-background shadow-sm text-foreground' : 'text-foreground hover:text-foreground'}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              News & Market Sentiment
            </Button>
          </div>
        </div>

        {/* Conditional Content Based on Current View */}
        {currentView === 'overview' ? (
          <>
            {/* Chart Controls */}
            <ChartControls
              yAxisPadding={yAxisPadding}
              onYAxisPaddingChange={handleYAxisPaddingChange}
              autoFit={autoFit}
              onAutoFitChange={handleAutoFitChange}
              minPrice={manualPriceRange.min}
              maxPrice={manualPriceRange.max}
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

            <CycleAnalysisPanel
              cycles={cycles}
              cycleStrength={cycleStrength}
              isVisible={showCycleAnalysis}
            />

            {/* Main Price Chart */}
            <Card className="p-6 mb-8 shadow-card border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-foreground">Price Chart with Technical Indicators</h2>
                <TimeRangeSelector 
                  selectedRange={timeRange}
                  onRangeChange={setTimeRange}
                />
              </div>
              <div className={`bg-chart-bg rounded-lg p-4`} style={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      domain={yAxisDomain}
                      tickFormatter={formatPriceShort}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatPrice(value), name]}
                      labelFormatter={(label) => `Date: ${formatDate(label)}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Legend />
                    
                     {visibleLines.bbUpper && <Line type="monotone" dataKey="bbUpper" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 2" name="BB Upper" dot={false} isAnimationActive={false} />}
                     {visibleLines.bbLower && <Line type="monotone" dataKey="bbLower" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 2" name="BB Lower" dot={false} isAnimationActive={false} />}
                     
                     {visibleLines.sma20 && <Line type="monotone" dataKey="sma20" stroke="hsl(var(--neutral))" strokeWidth={2} name="SMA 20" dot={false} isAnimationActive={false} />}
                     {visibleLines.sma50 && <Line type="monotone" dataKey="sma50" stroke="hsl(var(--bearish))" strokeWidth={2} name="SMA 50" dot={false} isAnimationActive={false} />}
                     {visibleLines.sma200 && <Line type="monotone" dataKey="sma200" stroke="hsl(var(--chart-4))" strokeWidth={2} name="SMA 200" dot={false} isAnimationActive={false} />}
                     {visibleLines.ema20 && <Line type="monotone" dataKey="ema20" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" name="EMA 20" dot={false} isAnimationActive={false} />}
                     {visibleLines.ema50 && <Line type="monotone" dataKey="ema50" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" name="EMA 50" dot={false} isAnimationActive={false} />}
                     
                     {/* VWAP Line with bright, visible color */}
                     {visibleLines.vwap && <Line type="monotone" dataKey="vwap" stroke="#FF6B35" strokeWidth={3} strokeDasharray="4 4" name="VWAP" dot={false} isAnimationActive={false} />}
                     
                     {visibleLines.price && <Line type="monotone" dataKey="price" stroke="hsl(var(--foreground))" strokeWidth={3} name="Price" dot={false} isAnimationActive={false} />}
                    
                    {/* Cycle Projection Lines with click handlers */}
                    {showCycleAnalysis && (
                      <>
                        {chartData.some(d => (d as any).cycle0) && (
                           <Line 
                             type="monotone" 
                             dataKey="cycle0" 
                             stroke="hsl(var(--cycle-1))" 
                             strokeWidth={2} 
                             strokeDasharray="8 8" 
                             name="Cycle 1" 
                             dot={false} 
                             isAnimationActive={false}
                             style={{ cursor: 'pointer' }}
                           />
                         )}
                         {chartData.some(d => (d as any).cycle1) && (
                           <Line 
                             type="monotone" 
                             dataKey="cycle1" 
                             stroke="hsl(var(--cycle-2))" 
                             strokeWidth={2} 
                             strokeDasharray="8 8" 
                             name="Cycle 2" 
                             dot={false} 
                             isAnimationActive={false}
                             style={{ cursor: 'pointer' }}
                           />
                         )}
                         {chartData.some(d => (d as any).cycle2) && (
                           <Line 
                             type="monotone" 
                             dataKey="cycle2" 
                             stroke="hsl(var(--cycle-3))" 
                             strokeWidth={2} 
                             strokeDasharray="8 8" 
                             name="Cycle 3" 
                             dot={false} 
                             isAnimationActive={false}
                             style={{ cursor: 'pointer' }}
                           />
                         )}
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </>
        ) : currentView === 'technical' ? (
          <>
        {/* Chart Controls */}
        <ChartControls
          yAxisPadding={yAxisPadding}
          onYAxisPaddingChange={handleYAxisPaddingChange}
          autoFit={autoFit}
          onAutoFitChange={handleAutoFitChange}
          minPrice={manualPriceRange.min}
          maxPrice={manualPriceRange.max}
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

        <CycleAnalysisPanel
          cycles={cycles}
          cycleStrength={cycleStrength}
          isVisible={showCycleAnalysis}
        />

        {/* Main Price Chart */}
        <Card className="p-6 mb-8 shadow-card border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-foreground">Price Chart with Technical Indicators</h2>
            <TimeRangeSelector 
              selectedRange={timeRange}
              onRangeChange={setTimeRange}
            />
          </div>
          <div className={`bg-chart-bg rounded-lg p-4`} style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  domain={yAxisDomain}
                  tickFormatter={formatPriceShort}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value, name) => [formatPrice(value), name]}
                  labelFormatter={(label) => `Date: ${formatDate(label)}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                
                 {visibleLines.bbUpper && <Line type="monotone" dataKey="bbUpper" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 2" name="BB Upper" dot={false} isAnimationActive={false} />}
                 {visibleLines.bbLower && <Line type="monotone" dataKey="bbLower" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 2" name="BB Lower" dot={false} isAnimationActive={false} />}
                 
                 {visibleLines.sma20 && <Line type="monotone" dataKey="sma20" stroke="hsl(var(--neutral))" strokeWidth={2} name="SMA 20" dot={false} isAnimationActive={false} />}
                 {visibleLines.sma50 && <Line type="monotone" dataKey="sma50" stroke="hsl(var(--bearish))" strokeWidth={2} name="SMA 50" dot={false} isAnimationActive={false} />}
                 {visibleLines.sma200 && <Line type="monotone" dataKey="sma200" stroke="hsl(var(--chart-4))" strokeWidth={2} name="SMA 200" dot={false} isAnimationActive={false} />}
                 {visibleLines.ema20 && <Line type="monotone" dataKey="ema20" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" name="EMA 20" dot={false} isAnimationActive={false} />}
                 {visibleLines.ema50 && <Line type="monotone" dataKey="ema50" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" name="EMA 50" dot={false} isAnimationActive={false} />}
                 
                 {/* VWAP Line with bright, visible color */}
                 {visibleLines.vwap && <Line type="monotone" dataKey="vwap" stroke="#FF6B35" strokeWidth={3} strokeDasharray="4 4" name="VWAP" dot={false} isAnimationActive={false} />}
                 
                 {visibleLines.price && <Line type="monotone" dataKey="price" stroke="hsl(var(--foreground))" strokeWidth={3} name="Price" dot={false} isAnimationActive={false} />}
                
                {/* Cycle Projection Lines with click handlers */}
                {showCycleAnalysis && (
                  <>
                    {chartData.some(d => (d as any).cycle0) && (
                       <Line 
                         type="monotone" 
                         dataKey="cycle0" 
                         stroke="rgba(255, 165, 0, 0.7)" 
                         strokeWidth={2} 
                         strokeDasharray="8 8" 
                         name="Cycle 1 Projection" 
                         dot={false}
                         connectNulls={false}
                         onClick={() => setSelectedCycleModal('cycle-1')}
                         style={{ cursor: 'pointer' }}
                         isAnimationActive={false}
                       />
                    )}
                    {chartData.some(d => (d as any).cycle1) && (
                       <Line 
                         type="monotone" 
                         dataKey="cycle1" 
                         stroke="rgba(75, 192, 192, 0.7)" 
                         strokeWidth={2} 
                         strokeDasharray="8 8" 
                         name="Cycle 2 Projection" 
                         dot={false}
                         connectNulls={false}
                         onClick={() => setSelectedCycleModal('cycle-2')}
                         style={{ cursor: 'pointer' }}
                         isAnimationActive={false}
                       />
                    )}
                    {chartData.some(d => (d as any).cycle2) && (
                       <Line 
                         type="monotone" 
                         dataKey="cycle2" 
                         stroke="rgba(153, 102, 255, 0.7)" 
                         strokeWidth={2} 
                         strokeDasharray="8 8" 
                         name="Cycle 3 Projection" 
                         dot={false}
                         connectNulls={false}
                         onClick={() => setSelectedCycleModal('cycle-3')}
                         style={{ cursor: 'pointer' }}
                         isAnimationActive={false}
                      />
                    )}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Price vs Global Liquidity Chart - Updated */}
        <Card className="p-6 mb-8 shadow-card border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Price vs TVL</h2>
              {m2Loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
            </div>
            <TimeRangeSelector 
              selectedRange={timeRange}
              onRangeChange={setTimeRange}
            />
          </div>
          
          {m2Error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">Failed to load M2 data: {m2Error.message}</p>
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
                  domain={yAxisDomain}
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
                    if (name === 'TVL') return [formatM2Supply(Number(value)), name];
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
                
                {filteredChartData.some(d => d.m2Supply) && (
                  <Line 
                    yAxisId="m2"
                    type="monotone" 
                    dataKey="m2Supply" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2} 
                    name="TVL" 
                    dot={false} 
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Indicator Charts - Updated to include Z-Score charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* RSI Chart */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">RSI ({indicators.rsiPeriod})</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  The Relative Strength Index (RSI) is a popular technical analysis tool used to evaluate the strength of a financial instrument's price movement. It's a momentum oscillator that measures the magnitude of recent price changes to assess overbought or oversold conditions in the market.
                </p>
                
                {/* RSI Current Recommendation */}
                {indicators.rsi !== null && (
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current RSI: </span>
                      <span className="font-semibold">{indicators.rsi.toFixed(2)}</span>
                      <span className="text-muted-foreground ml-4">Signal: </span>
                      <span className={`font-semibold ${
                        indicators.rsi < 30 ? 'text-green-600' : 
                        indicators.rsi >= 30 && indicators.rsi <= 70 ? 'text-yellow-600' : 
                        indicators.rsi > 70 && indicators.rsi <= 80 ? 'text-orange-600' : 
                        'text-red-600'
                      }`}>
                        {indicators.rsi < 30 ? 'Moderate Buy' : 
                         indicators.rsi >= 30 && indicators.rsi <= 70 ? 'Neutral' : 
                         indicators.rsi > 70 && indicators.rsi <= 80 ? 'Moderate Sell' : 
                         'Strong Sell'}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        (Risk: 
                        <span className={`ml-1 ${
                          indicators.rsi < 30 ? 'text-green-500' : 
                          indicators.rsi >= 30 && indicators.rsi <= 70 ? 'text-yellow-500' : 
                          indicators.rsi > 70 && indicators.rsi <= 80 ? 'text-orange-500' : 
                          'text-red-500'
                        }`}>
                          {indicators.rsi < 30 ? 'Low' : 
                           indicators.rsi >= 30 && indicators.rsi <= 70 ? 'Very Low' : 
                           indicators.rsi > 70 && indicators.rsi <= 80 ? 'Low' : 
                           'Medium'}
                        </span>)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <TimeRangeSelector 
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                className="scale-90"
              />
            </div>
            <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', `RSI (${indicators.rsiPeriod})`]}
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
                  <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
                  <Line type="monotone" dataKey="rsi" stroke="hsl(var(--accent))" strokeWidth={2} name={`RSI (${indicators.rsiPeriod})`} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* CCI Chart */}
          <Card className="p-6 shadow-card border-border">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2">Commodity Channel Index (CCI) - Last 20 days</h2>
              <p className="text-sm text-muted-foreground">
                A momentum-based technical indicator used to identify overbought and oversold conditions in a market. It measures the deviation of an asset's price from its average price over a specific period, typically 20 periods. CCI can be used to spot potential trend changes, reversals, and the strength of existing trends.
              </p>
              
              {/* CCI Status and Recommendation */}
              {chartData.length > 0 && chartData[chartData.length - 1].cci !== null && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Current CCI: </span>
                    <span className={`font-semibold ${
                      chartData[chartData.length - 1].cci > 100 ? 'text-red-600' : 
                      chartData[chartData.length - 1].cci < -100 ? 'text-green-600' : 
                      'text-yellow-600'
                    }`}>
                      {chartData[chartData.length - 1].cci.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground ml-4">Signal: </span>
                    <span className={`font-semibold ${
                      chartData[chartData.length - 1].cci > -100 && chartData[chartData.length - 1].cci <= 100 ? 'text-green-600' : 
                      chartData[chartData.length - 1].cci > 100 ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {chartData[chartData.length - 1].cci > -100 && chartData[chartData.length - 1].cci <= 100 ? 'BUY' : 
                       chartData[chartData.length - 1].cci > 100 ? 'SELL' : 
                       'OVERSOLD'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-20)}>
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

          {/* Time Series Momentum Chart */}
          <TimeSeriesMomentumChart
            chartData={chartData}
            chartHeight={chartHeight}
            formatDate={formatDate}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* ROC Chart */}
          <ROCChart
            chartData={chartData}
            chartHeight={chartHeight}
            formatDate={formatDate}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* MACD Chart - Separated with its own parameters */}
          <MACDChart 
            chartData={chartData}
            chartHeight={chartHeight}
            formatDate={formatDate}
          />

          {/* NEW Price Z-Score Chart */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-foreground">Price Z-Score (30)</h2>
              <TimeRangeSelector 
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                className="scale-90"
              />
            </div>
            <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[-3, 3]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'Price Z-Score']}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <ReferenceLine y={2} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Extremely High" />
                  <ReferenceLine y={1} stroke="hsl(var(--neutral))" strokeDasharray="2 2" label="High" />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" label="Average" />
                  <ReferenceLine y={-1} stroke="hsl(var(--neutral))" strokeDasharray="2 2" label="Low" />
                  <ReferenceLine y={-2} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Extremely Low" />
                  <Line type="monotone" dataKey="priceZScore" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Price Z-Score" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* NEW Volume Z-Score Chart */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-foreground">Volume Z-Score (30)</h2>
              <TimeRangeSelector 
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                className="scale-90"
              />
            </div>
            <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[-3, 4]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'Volume Z-Score']}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <ReferenceLine y={2} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Strong Interest" />
                  <ReferenceLine y={1} stroke="hsl(var(--neutral))" strokeDasharray="2 2" label="Above Average" />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" label="Average" />
                  <ReferenceLine y={-1} stroke="hsl(var(--bearish))" strokeDasharray="2 2" label="Low Activity" />
                  <Line type="monotone" dataKey="volumeZScore" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Volume Z-Score" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Stochastic Chart - Separated with its own parameters */}
          <StochasticChart 
            chartData={chartData}
            chartHeight={chartHeight}
            formatDate={formatDate}
          />

          {/* ADX Chart */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-foreground">ADX Trend Strength (14)</h2>
              <TimeRangeSelector 
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                className="scale-90"
              />
            </div>
            <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 60]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'ADX']}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <ReferenceLine y={25} stroke="hsl(var(--bullish))" strokeDasharray="2 2" label="Strong Trend" />
                  <ReferenceLine y={20} stroke="hsl(var(--neutral))" strokeDasharray="2 2" label="Moderate" />
                  <Line type="monotone" dataKey="adx" stroke="hsl(var(--chart-2))" strokeWidth={2} name="ADX" dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>


        {/* Moving Averages Table */}
        <Card className="p-6 shadow-card border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Moving Averages Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-semibold text-muted-foreground">Period</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">SMA</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">EMA</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Price vs SMA</th>
                  <th className="text-left p-3 font-semibold text-muted-foreground">Price vs EMA</th>
                </tr>
              </thead>
              <tbody>
                {[5, 20, 50, 100, 200].map(period => (
                  <tr key={period} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">{period}</td>
                    <td className="p-3">{formatPrice(indicators[`sma${period}`])}</td>
                    <td className="p-3">{formatPrice(indicators[`ema${period}`])}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        indicators.currentPrice > indicators[`sma${period}`] 
                          ? 'bg-bullish/20 text-bullish' 
                          : 'bg-bearish/20 text-bearish'
                      }`}>
                        {indicators.currentPrice > indicators[`sma${period}`] ? 'Above' : 'Below'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        indicators.currentPrice > indicators[`ema${period}`] 
                          ? 'bg-bullish/20 text-bullish' 
                          : 'bg-bearish/20 text-bearish'
                      }`}>
                        {indicators.currentPrice > indicators[`ema${period}`] ? 'Above' : 'Below'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>


          </>
        ) : currentView === 'ai-trade' ? (
          <>
        {/* AI Trade of the Day View */}
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI Trade of the Day
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get AI-powered trading insights and recommendations based on advanced market analysis and technical indicators.
            </p>
          </div>


          {/* AI Recommendation - Main Feature */}
          <AIRecommendationSection 
            symbol={symbol} 
            marketData={{
              price: indicators.currentPrice,
              change: rawData.length >= 2 ? ((rawData[rawData.length - 1]?.close - rawData[rawData.length - 2]?.close) / rawData[rawData.length - 2]?.close * 100) : 0,
              rsi: indicators.rsi,
              macd: indicators.macdSignal > 0 ? 'Bullish' : 'Bearish',
              fearGreed: fearGreedData?.value ? parseInt(fearGreedData.value) : undefined,
              rank: fearGreedData?.value_classification === 'Extreme Fear' ? 1 : undefined,
              maStatus: indicators.currentPrice > indicators.sma200 ? 'Above SMA200' : 'Below SMA200',
              volume: 'Analyzing current levels',
              levels: 'Analyzing current levels'
            }}
          />


          {/* Disclaimer */}
          <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                  <Activity className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Important Disclaimer
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This AI analysis is for educational and informational purposes only. It is not financial advice. 
                    Cryptocurrency trading involves substantial risk of loss. Always conduct your own research and 
                    consider your risk tolerance before making any investment decisions.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
          </>
        ) : (
          <>
          {/* News & Market Sentiment View */}
          <div className="space-y-6">
            {/* News Section */}
            <NewsSection symbol={symbol} />
            
          </div>
          </>
        )}


        {/* Cycle Projection Modal */}
        <CycleProjectionModal
          isOpen={selectedCycleModal !== null}
          onClose={() => setSelectedCycleModal(null)}
          cycleId={selectedCycleModal}
        />
      </div>
    </div>
  );
};

export default TradingDashboard;
