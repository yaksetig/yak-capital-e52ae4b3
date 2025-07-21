
export interface DataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface TechnicalIndicators {
  sma: number | null;
  ema: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  cci: number | null;
  adx: number | null;
  stochK: number | null;
  stochD: number | null;
}

export const calculateSMA = (data: DataPoint[], period: number, index: number): number | null => {
  if (index < period - 1) return null;
  
  const sum = data.slice(index - period + 1, index + 1).reduce((acc, point) => acc + point.price, 0);
  return sum / period;
};

export const calculateEMA = (data: DataPoint[], period: number, index: number, prevEMA?: number): number | null => {
  if (index < period - 1) return null;
  
  const multiplier = 2 / (period + 1);
  const currentPrice = data[index].price;
  
  if (prevEMA === undefined) {
    return calculateSMA(data, period, index);
  }
  
  return (currentPrice - prevEMA) * multiplier + prevEMA;
};

export const calculateRSI = (data: DataPoint[], period: number, index: number): number | null => {
  if (index < period) return null;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = index - period + 1; i <= index; i++) {
    const change = data[i].price - data[i - 1].price;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  if (losses === 0) return 100;
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  
  return 100 - (100 / (1 + rs));
};

export const calculateMACD = (data: DataPoint[], fastPeriod: number, slowPeriod: number, signalPeriod: number, index: number): { macd: number | null; signal: number | null; histogram: number | null } => {
  if (index < slowPeriod - 1) return { macd: null, signal: null, histogram: null };
  
  const fastEMA = calculateEMA(data, fastPeriod, index);
  const slowEMA = calculateEMA(data, slowPeriod, index);
  
  if (fastEMA === null || slowEMA === null) {
    return { macd: null, signal: null, histogram: null };
  }
  
  const macd = fastEMA - slowEMA;
  
  // For signal line calculation, we would need to maintain EMA of MACD values
  // This is a simplified version
  const signal = macd; // Placeholder
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
};

export const calculateCCI = (data: DataPoint[], period: number, index: number): number | null => {
  if (index < period - 1) return null;
  
  const recentData = data.slice(index - period + 1, index + 1);
  const typicalPrices = recentData.map(point => point.price); // Simplified: using price as typical price
  
  const sma = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
  const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
  
  if (meanDeviation === 0) return 0;
  
  const currentTypicalPrice = data[index].price;
  return (currentTypicalPrice - sma) / (0.015 * meanDeviation);
};

export const calculateStochastic = (data: DataPoint[], kPeriod: number, dPeriod: number, index: number): { stochK: number | null; stochD: number | null } => {
  if (index < kPeriod - 1) return { stochK: null, stochD: null };
  
  const recentData = data.slice(index - kPeriod + 1, index + 1);
  const highest = Math.max(...recentData.map(d => d.price));
  const lowest = Math.min(...recentData.map(d => d.price));
  
  if (highest === lowest) return { stochK: 50, stochD: 50 };
  
  const stochK = ((data[index].price - lowest) / (highest - lowest)) * 100;
  
  // Simplified %D calculation
  const stochD = stochK; // Would need to calculate SMA of %K values
  
  return { stochK, stochD };
};

export const calculateADX = (data: DataPoint[], period: number, index: number): number | null => {
  if (index < period + 1) return null;
  
  // Simplified ADX calculation
  // In reality, this requires calculating True Range, +DI, -DI, and then DX
  return Math.random() * 100; // Placeholder for now
};

export const calculateZScore = (data: DataPoint[], period: number, index: number): number | null => {
  if (index < period - 1) return null;
  
  const recentPrices = data.slice(index - period + 1, index + 1).map(d => d.price);
  const mean = recentPrices.reduce((sum, price) => sum + price, 0) / period;
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  if (standardDeviation === 0) return 0;
  
  return (data[index].price - mean) / standardDeviation;
};
