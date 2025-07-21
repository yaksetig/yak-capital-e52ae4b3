
import { useMemo } from 'react';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD, 
  calculateCCI, 
  calculateStochastic, 
  calculateADX, 
  calculateZScore,
  DataPoint,
  TechnicalIndicators
} from '@/utils/technicalIndicators';

export interface ProcessedDataPoint extends DataPoint {
  date: string;
  sma20: number | null;
  sma50: number | null;
  ema12: number | null;
  ema26: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  cci: number | null;
  adx: number | null;
  stochK: number | null;
  stochD: number | null;
  zScore: number | null;
}

export const useProcessedChartData = (rawData: DataPoint[]) => {
  const processedData = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    return rawData.map((point, index) => {
      const date = new Date(point.timestamp * 1000).toISOString().split('T')[0];
      
      // Calculate technical indicators
      const sma20 = calculateSMA(rawData, 20, index);
      const sma50 = calculateSMA(rawData, 50, index);
      const ema12 = calculateEMA(rawData, 12, index);
      const ema26 = calculateEMA(rawData, 26, index);
      const rsi = calculateRSI(rawData, 14, index);
      const macdData = calculateMACD(rawData, 12, 26, 9, index);
      const cci = calculateCCI(rawData, 20, index);
      const stochData = calculateStochastic(rawData, 14, 3, index);
      const adx = calculateADX(rawData, 14, index);
      const zScore = calculateZScore(rawData, 20, index);

      return {
        ...point,
        date,
        sma20,
        sma50,
        ema12,
        ema26,
        rsi,
        macd: macdData.macd,
        macdSignal: macdData.signal,
        macdHistogram: macdData.histogram,
        cci,
        adx,
        stochK: stochData.stochK,
        stochD: stochData.stochD,
        zScore,
      };
    });
  }, [rawData]);

  const filteredData = useMemo(() => {
    return (timeRange: string) => {
      if (timeRange === 'all') return processedData;
      
      const days = parseInt(timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return processedData.filter(point => 
        new Date(point.timestamp * 1000) >= cutoffDate
      );
    };
  }, [processedData]);

  return { processedData, filteredData };
};
