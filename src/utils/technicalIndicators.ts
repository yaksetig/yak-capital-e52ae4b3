
import { CandleData, TechnicalIndicators } from '@/types/trading';

export const calculateSMA = (data: number[], period: number): number | null => {
  if (data.length < period) return null;
  const sum = data.slice(-period).reduce((acc, val) => acc + val, 0);
  return sum / period;
};

export const calculateEMA = (data: number[], period: number): number[] => {
  if (data.length === 0) return [];
  
  const multiplier = 2 / (period + 1);
  const emaValues = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    const ema = (data[i] * multiplier) + (emaValues[i - 1] * (1 - multiplier));
    emaValues.push(ema);
  }
  
  return emaValues;
};

export const calculateRSI = (prices: number[], period: number = 14): number | null => {
  if (prices.length < period + 1) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

export const calculateMACD = (prices: number[]): { macd: number | null; signal: number | null; histogram: number | null } => {
  if (prices.length < 26) return { macd: null, signal: null, histogram: null };
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  if (ema12.length === 0 || ema26.length === 0) return { macd: null, signal: null, histogram: null };
  
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  
  // For signal line, we need MACD history
  const macdHistory = [];
  for (let i = 25; i < prices.length; i++) {
    const ema12Val = calculateEMA(prices.slice(0, i + 1), 12);
    const ema26Val = calculateEMA(prices.slice(0, i + 1), 26);
    if (ema12Val.length > 0 && ema26Val.length > 0) {
      macdHistory.push(ema12Val[ema12Val.length - 1] - ema26Val[ema26Val.length - 1]);
    }
  }
  
  const signalLine = macdHistory.length >= 9 
    ? calculateEMA(macdHistory, 9)
    : [];
  
  const signal = signalLine.length > 0 ? signalLine[signalLine.length - 1] : null;
  const histogram = signal !== null ? macdLine - signal : null;
  
  return { macd: macdLine, signal, histogram };
};

export const calculateStochastic = (highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): { k: number | null; d: number | null } => {
  if (highs.length < kPeriod || lows.length < kPeriod || closes.length < kPeriod) {
    return { k: null, d: null };
  }
  
  const recentHighs = highs.slice(-kPeriod);
  const recentLows = lows.slice(-kPeriod);
  const currentClose = closes[closes.length - 1];
  
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  
  if (highestHigh === lowestLow) return { k: 50, d: 50 };
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  
  // Calculate D (3-period SMA of K)
  const kValues = [];
  for (let i = closes.length - dPeriod; i < closes.length; i++) {
    if (i >= kPeriod - 1) {
      const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
      const periodLows = lows.slice(i - kPeriod + 1, i + 1);
      const periodHigh = Math.max(...periodHighs);
      const periodLow = Math.min(...periodLows);
      
      if (periodHigh !== periodLow) {
        kValues.push(((closes[i] - periodLow) / (periodHigh - periodLow)) * 100);
      }
    }
  }
  
  const d = kValues.length >= dPeriod 
    ? kValues.slice(-dPeriod).reduce((sum, val) => sum + val, 0) / dPeriod 
    : null;
  
  return { k, d };
};

export const calculateAllIndicators = (data: CandleData[]): TechnicalIndicators => {
  if (data.length === 0) {
    return {
      rsi: null,
      macd: { macd: null, signal: null, histogram: null },
      stochastic: { k: null, d: null },
      sma20: null,
      sma50: null,
      ema12: null,
      ema26: null,
    };
  }
  
  const prices = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  return {
    rsi: calculateRSI(prices),
    macd: calculateMACD(prices),
    stochastic: calculateStochastic(highs, lows, prices),
    sma20: calculateSMA(prices, 20),
    sma50: calculateSMA(prices, 50),
    ema12: calculateEMA(prices, 12).slice(-1)[0] || null,
    ema26: calculateEMA(prices, 26).slice(-1)[0] || null,
  };
};
