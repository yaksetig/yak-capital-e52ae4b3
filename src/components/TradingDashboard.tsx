import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, BarChart, Bar, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity, BookOpen, Brain, Frown, Smile, Meh } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import InfoCard from './InfoCard';
import TimeRangeSelector from './TimeRangeSelector';
import ChartControls from './ChartControls';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import NewsSection from './NewsSection';
import CycleProjectionModal from './CycleProjectionModal';
import { analyzeCycles, generateCycleProjections, calculateCycleStrength, CyclePeak } from '../utils/cycleAnalysis';
import { useFearGreedIndex } from '../hooks/useFearGreedIndex';

const TradingDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1d');
  const [timeRange, setTimeRange] = useState('60');
  const [showEducation, setShowEducation] = useState(false);
  const [selectedCycleModal, setSelectedCycleModal] = useState<string | null>(null);

  // Chart zoom and display controls
  const [yAxisPadding, setYAxisPadding] = useState(10);
  const [autoFit, setAutoFit] = useState(true);
  const [manualPriceRange, setManualPriceRange] = useState({ min: 0, max: 0 });
  const [chartHeight, setChartHeight] = useState(400);
  const [visibleLines, setVisibleLines] = useState({
    sma20: true,
    sma50: true,
    ema20: true,
    ema50: true,
    bbUpper: true,
    bbMiddle: true,
    bbLower: true,
  });

  // Cycle analysis state
  const [showCycleAnalysis, setShowCycleAnalysis] = useState(false);

  // Fear and Greed Index
  const { data: fearGreedData, loading: fearGreedLoading, error: fearGreedError, refetch: refetchFearGreed } = useFearGreedIndex();

  // Configuration
  const LOOKBACK_DAYS = 201;
  const SMA_PERIODS = [5, 20, 50, 100, 200];
  const EMA_PERIODS = [5, 20, 50, 100, 200];
  const RSI_PERIOD = 14;
  const BB_PERIOD = 20;
  const BB_MULTIPLIER = 2;
  const MACD_FAST = 12;
  const MACD_SLOW = 26;
  const MACD_SIGNAL = 9;

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

  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return { chartData: [], indicators: null, cycles: [], cycleStrength: 0, cycleProjections: [] };

    const prices = rawData.map(candle => parseFloat(candle[4]));
    
    if (prices.length < LOOKBACK_DAYS) {
      return { chartData: [], indicators: null, cycles: [], cycleStrength: 0, cycleProjections: [] };
    }

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
    
    // Calculate ATR and VWAP
    const currentATR = calculateATR(rawData, 14);
    const currentVWAP = calculateVWAP(rawData);
    
    const currentPrice = prices[prices.length - 1];
    
    // Ensure SMAs exist before comparison
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

    const priceAboveSMA20 = currentSMAs.sma20 ? currentPrice > currentSMAs.sma20 : false;
    const priceAboveSMA50 = currentSMAs.sma50 ? currentPrice > currentSMAs.sma50 : false;
    const priceAboveSMA200 = currentSMAs.sma200 ? currentPrice > currentSMAs.sma200 : false;
    const priceAboveEMA20 = currentEMAs.ema20 ? currentPrice > currentEMAs.ema20 : false;
    const priceAboveEMA50 = currentEMAs.ema50 ? currentPrice > currentEMAs.ema50 : false;
    const priceAboveVWAP = currentVWAP ? currentPrice > currentVWAP : false;
    const priceNearBBLower = bbLower !== null && bbMiddle !== null ? currentPrice < (bbLower + (bbMiddle - bbLower) * 0.1) : false;
    const sma20AboveSMA50 = (currentSMAs.sma20 && currentSMAs.sma50) ? currentSMAs.sma20 > currentSMAs.sma50 : false;
    const sma50AboveSMA200 = (currentSMAs.sma50 && currentSMAs.sma200) ? currentSMAs.sma50 > currentSMAs.sma200 : false;

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

    let marketSentiment;
    if (bullishScore >= 8) marketSentiment = "bullish";
    else if (bullishScore <= 3) marketSentiment = "bearish";
    else marketSentiment = "neutral";

    // Prepare chart data with VWAP
    const vwapArray = calculateVWAPArray(rawData.slice(-60));
    const chartData = rawData.slice(-60).map((candle, index) => {
      const timestamp = parseInt(candle[0]);
      const price = parseFloat(candle[4]);
      const volume = parseFloat(candle[5]);
      const date = new Date(timestamp);
      
      const sliceIndex = rawData.length - 60 + index + 1;
      const pricesUpToThis = prices.slice(0, sliceIndex);
      const candlesUpToThis = rawData.slice(0, sliceIndex);
      
      const sma20 = calculateSMA(pricesUpToThis, 20);
      const sma50 = calculateSMA(pricesUpToThis, 50);
      const ema20 = calculateEMA(pricesUpToThis, 20);
      const ema50 = calculateEMA(pricesUpToThis, 50);
      const rsi = calculateRSI(pricesUpToThis, RSI_PERIOD);
      const atr = calculateATR(candlesUpToThis, 14);
      
      const bbMid = calculateSMA(pricesUpToThis, BB_PERIOD);
      const bbStd = calculateStandardDeviation(pricesUpToThis, BB_PERIOD);
      const bbUp = bbMid !== null && bbStd !== null ? bbMid + (BB_MULTIPLIER * bbStd) : null;
      const bbLow = bbMid !== null && bbStd !== null ? bbMid - (BB_MULTIPLIER * bbStd) : null;
      
      let macd = null, macdSig = null, macdHist = null;
      if (pricesUpToThis.length >= MACD_SLOW) {
        const macdRes = calculateMACD(pricesUpToThis, MACD_FAST, MACD_SLOW, MACD_SIGNAL);
        if (macdRes) {
          macd = macdRes.macd;
          macdSig = macdRes.signal;
          macdHist = macdRes.histogram;
        }
      }

      return {
        date: date.toISOString().split('T')[0],
        timestamp: timestamp,
        price: price,
        volume: volume,
        sma20: sma20,
        sma50: sma50,
        ema20: ema20,
        ema50: ema50,
        bbUpper: bbUp,
        bbMiddle: bbMid,
        bbLower: bbLow,
        rsi: rsi,
        macd: macd,
        macdSignal: macdSig,
        macdHistogram: macdHist,
        atr: atr,
        vwap: vwapArray[index]
      };
    });

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
      bullishScore,
      marketSentiment,
      crossSignal,
      priceAboveSMA20,
      priceAboveSMA50,
      priceAboveSMA200,
      priceAboveEMA20,
      priceAboveEMA50,
      priceAboveVWAP
    };

    // Cycle analysis
    const cyclePrices = chartData.map(d => d.price);
    const cycles = showCycleAnalysis ? analyzeCycles(cyclePrices) : [];
    const cycleStrength = calculateCycleStrength(cycles);
    const cycleProjections = showCycleAnalysis && cycles.length > 0 
      ? generateCycleProjections(chartData, cycles) 
      : [];

    // Debug cycle analysis
    if (showCycleAnalysis && cycles.length > 0) {
      console.log('Cycle Analysis Results:', {
        cycleCount: cycles.length,
        cycleStrength,
        topCycles: cycles.slice(0, 3),
        projectionCount: cycleProjections.length
      });
    }

    // Integrate cycle projections with chart data
    let extendedChartData = [...chartData];
    
    if (showCycleAnalysis && cycleProjections.length > 0) {
      // Group projections by timestamp
      const projectionsByTimestamp = cycleProjections.reduce((acc, proj) => {
        if (!acc[proj.timestamp]) {
          acc[proj.timestamp] = {
            date: new Date(proj.timestamp).toISOString().split('T')[0],
            timestamp: proj.timestamp,
            price: null, // Future data point
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
        
        // Add cycle projection values (only if meaningful - not zero or very small)
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
      
      // Add projection data points to chart
      const projectionDataPoints = Object.values(projectionsByTimestamp) as any[];
      extendedChartData = [...chartData, ...projectionDataPoints];
    }

    return { chartData: extendedChartData, indicators, cycles, cycleStrength, cycleProjections };
  }, [rawData, showCycleAnalysis]);

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
        
        {/* Key Metrics Grid - Removed Technical Sentiment card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 shadow-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-muted-foreground">Current Price</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{formatPrice(indicators.currentPrice)}</p>
          </Card>
          
          <Card className="p-4 shadow-card border-border">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-neutral" />
              <UITooltip>
                <TooltipTrigger>
                  <h3 className="text-sm font-semibold text-muted-foreground cursor-help">Market Momentum</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">RSI (Relative Strength Index) measures momentum. Values above 70 suggest overbought conditions, below 30 suggest oversold conditions.</p>
                </TooltipContent>
              </UITooltip>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-xl font-bold ${getRSIColor(indicators.rsi)}`}>
                {indicators.rsi ? indicators.rsi.toFixed(0) : 'N/A'}
              </p>
              <span className={`text-sm font-medium ${getRSIColor(indicators.rsi)}`}>
                {indicators.rsi ? getRSIDescription(indicators.rsi) : ''}
              </span>
            </div>
          </Card>
          
          <Card className="p-4 shadow-card border-border">
            <div className="flex items-center gap-2 mb-2">
              {fearGreedData ? (
                (() => {
                  const IconComponent = getFearGreedIcon(fearGreedData.value_classification);
                  return <IconComponent className="w-4 h-4 text-primary" />;
                })()
              ) : (
                <Activity className="w-4 h-4 text-primary" />
              )}
              <UITooltip>
                <TooltipTrigger>
                  <h3 className="text-sm font-semibold text-muted-foreground cursor-help">Fear & Greed</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">The Fear & Greed Index measures market emotions. Extreme fear can indicate buying opportunities, while extreme greed may suggest caution.</p>
                </TooltipContent>
              </UITooltip>
            </div>
            {fearGreedLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : fearGreedError ? (
              <p className="text-xs text-destructive">Error loading</p>
            ) : fearGreedData ? (
              <div className="flex items-center gap-2">
                <p className={`text-xl font-bold ${getFearGreedColor(fearGreedData.value_classification)}`}>
                  {fearGreedData.value}
                </p>
                <span className={`text-sm font-medium ${getFearGreedColor(fearGreedData.value_classification)}`}>
                  {fearGreedData.value_classification}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">N/A</p>
            )}
          </Card>
        </div>

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
                
                {visibleLines.bbUpper && <Line type="monotone" dataKey="bbUpper" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 2" name="BB Upper" dot={false} />}
                {visibleLines.bbLower && <Line type="monotone" dataKey="bbLower" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="2 2" name="BB Lower" dot={false} />}
                {visibleLines.bbMiddle && <Line type="monotone" dataKey="bbMiddle" stroke="hsl(var(--muted-foreground))" strokeWidth={1} name="BB Middle" dot={false} />}
                
                {visibleLines.sma20 && <Line type="monotone" dataKey="sma20" stroke="hsl(var(--neutral))" strokeWidth={2} name="SMA 20" dot={false} />}
                {visibleLines.sma50 && <Line type="monotone" dataKey="sma50" stroke="hsl(var(--bearish))" strokeWidth={2} name="SMA 50" dot={false} />}
                {visibleLines.ema20 && <Line type="monotone" dataKey="ema20" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" name="EMA 20" dot={false} />}
                {visibleLines.ema50 && <Line type="monotone" dataKey="ema50" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" name="EMA 50" dot={false} />}
                
                {/* VWAP Line */}
                <Line type="monotone" dataKey="vwap" stroke="hsl(var(--chart-1))" strokeWidth={2} strokeDasharray="3 3" name="VWAP" dot={false} />
                
                <Line type="monotone" dataKey="price" stroke="hsl(var(--foreground))" strokeWidth={3} name="Price" dot={false} />
                
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
                      />
                    )}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Indicator Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* RSI Chart */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-foreground">RSI (14)</h2>
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
                    formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : 'N/A', 'RSI']}
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
                  <Line type="monotone" dataKey="rsi" stroke="hsl(var(--accent))" strokeWidth={2} name="RSI" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* MACD Chart */}
          <Card className="p-6 shadow-card border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-foreground">MACD (12,26,9)</h2>
              <TimeRangeSelector 
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                className="scale-90"
              />
            </div>
            <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight * 0.7 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
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
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="1 1" />
                  <Line type="monotone" dataKey="macd" stroke="hsl(var(--primary))" strokeWidth={2} name="MACD" dot={false} />
                  <Line type="monotone" dataKey="macdSignal" stroke="hsl(var(--bearish))" strokeWidth={2} name="Signal" dot={false} />
                  <Bar dataKey="macdHistogram" fill="hsl(var(--bullish))" name="Histogram" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Technical Indicators Summary */}
        <Card className="p-6 mb-8 shadow-card border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Technical Indicators Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Trend Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary">Trend Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Price vs VWAP:</span>
                  <span className={`font-medium ${indicators.priceAboveVWAP ? 'text-bullish' : 'text-bearish'}`}>
                    {indicators.priceAboveVWAP ? 'Above' : 'Below'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>SMA 50/200 Cross:</span>
                  <span className={`font-medium ${indicators.sma50 && indicators.sma200 && indicators.sma50 > indicators.sma200 ? 'text-bullish' : 'text-bearish'}`}>
                    {indicators.crossSignal === 'golden_cross' ? 'Golden Cross' : 
                     indicators.crossSignal === 'death_cross' ? 'Death Cross' : 
                     indicators.sma50 && indicators.sma200 && indicators.sma50 > indicators.sma200 ? 'Bullish' : 'Bearish'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MACD Signal:</span>
                  <span className={`font-medium ${
                    indicators.macdCrossover === 'bullish_crossover' ? 'text-bullish' : 
                    indicators.macdCrossover === 'bearish_crossover' ? 'text-bearish' : 'text-neutral'
                  }`}>
                    {indicators.macdCrossover === 'bullish_crossover' ? 'Bullish Cross' :
                     indicators.macdCrossover === 'bearish_crossover' ? 'Bearish Cross' : 'No Signal'}
                  </span>
                </div>
              </div>
            </div>

            {/* Momentum Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-accent">Momentum Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>RSI Signal:</span>
                  <span className={`font-medium ${
                    indicators.rsiSignal === 'Overbought' ? 'text-bearish' : 
                    indicators.rsiSignal === 'Oversold' ? 'text-bullish' : 'text-neutral'
                  }`}>
                    {indicators.rsiSignal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>RSI Value:</span>
                  <span className="font-medium">{indicators.rsi ? indicators.rsi.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>MACD vs Signal:</span>
                  <span className={`font-medium ${indicators.macd && indicators.macdSignal && indicators.macd > indicators.macdSignal ? 'text-bullish' : 'text-bearish'}`}>
                    {indicators.macd && indicators.macdSignal ? (indicators.macd > indicators.macdSignal ? 'Above' : 'Below') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Volatility & Volume */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-chart-1">Volatility & Volume</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>ATR (14):</span>
                  <span className="font-medium">{indicators.atr ? `${indicators.atr.toFixed(2)}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>VWAP:</span>
                  <span className="font-medium">{formatPrice(indicators.vwap)}</span>
                </div>
                <div className="flex justify-between">
                  <span>BB Position:</span>
                  <span className={`font-medium ${
                    indicators.bbUpper && indicators.currentPrice > indicators.bbUpper ? 'text-bearish' : 
                    indicators.bbLower && indicators.currentPrice < indicators.bbLower ? 'text-bullish' : 'text-neutral'
                  }`}>
                    {indicators.bbUpper && indicators.currentPrice > indicators.bbUpper ? 'Above Upper' :
                     indicators.bbLower && indicators.currentPrice < indicators.bbLower ? 'Below Lower' : 'In Range'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Sentiment */}
          <div className="mt-6 p-4 rounded-lg bg-card border">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Overall Market Sentiment</h3>
                <p className="text-sm text-muted-foreground">Based on {indicators.bullishScore}/12 bullish signals</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold capitalize ${getSentimentColor(indicators.marketSentiment)}`}>
                  {indicators.marketSentiment}
                </p>
                <div className="w-32 bg-muted rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      indicators.marketSentiment === 'bullish' ? 'bg-bullish' :
                      indicators.marketSentiment === 'bearish' ? 'bg-bearish' : 'bg-neutral'
                    }`}
                    style={{
                      width: `${(indicators.bullishScore / 12) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </Card>

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

        {/* News Section */}
        <NewsSection symbol={symbol} />

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
