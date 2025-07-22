
import { CandleData, ProcessedChartData, TechnicalIndicators } from '@/types/trading';
import { calculateEMA, calculateRSI, calculateMACD, calculateStochastic, calculateSMA } from './technicalIndicators';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const processChartData = (rawData: CandleData[]): ProcessedChartData[] => {
  if (rawData.length === 0) return [];
  
  const prices = rawData.map(d => d.close);
  const highs = rawData.map(d => d.high);
  const lows = rawData.map(d => d.low);
  
  // Calculate indicators for all data points
  const ema12Values = calculateEMA(prices, 12);
  const ema26Values = calculateEMA(prices, 26);
  
  return rawData.map((candle, index) => {
    const priceSlice = prices.slice(0, index + 1);
    const highSlice = highs.slice(0, index + 1);
    const lowSlice = lows.slice(0, index + 1);
    
    const rsi = calculateRSI(priceSlice);
    const macd = calculateMACD(priceSlice);
    const stoch = calculateStochastic(highSlice, lowSlice, priceSlice);
    const sma20 = calculateSMA(priceSlice, 20);
    const sma50 = calculateSMA(priceSlice, 50);
    
    return {
      date: candle.date,
      price: candle.close,
      volume: candle.volume,
      rsi,
      macd: macd.macd,
      macdSignal: macd.signal,
      macdHistogram: macd.histogram,
      stochK: stoch.k,
      stochD: stoch.d,
      sma20,
      sma50,
    };
  });
};

export const filterDataByTimeRange = (data: CandleData[], timeRange: string): CandleData[] => {
  if (timeRange === 'all' || data.length === 0) return data;
  
  const days = parseInt(timeRange);
  if (isNaN(days)) return data;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return data.filter(item => new Date(item.date) >= cutoffDate);
};

export const getChartHeight = (): number => {
  return Math.max(400, Math.min(600, window.innerHeight * 0.4));
};
