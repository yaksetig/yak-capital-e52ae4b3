
import { useState, useEffect, useCallback } from 'react';

interface CurrentCandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface UseCurrentCandleReturn {
  currentCandle: CurrentCandleData | null;
  isLoading: boolean;
  error: string | null;
}

export const useCurrentCandle = (
  symbol: string = 'BTCUSDT',
  currentPrice: number | null,
  enabled: boolean = true
): UseCurrentCandleReturn => {
  const [currentCandle, setCurrentCandle] = useState<CurrentCandleData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentCandle = useCallback(async () => {
    try {
      // Get today's candle data (1d interval, limit 1 for current day)
      const now = Date.now();
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const startTime = startOfDay.getTime();

      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&startTime=${startTime}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const [timestamp, open, high, low, close, volume] = data[0];
        
        // Create current candle with live price as close
        const candle: CurrentCandleData = {
          open: parseFloat(open),
          high: currentPrice ? Math.max(parseFloat(high), currentPrice) : parseFloat(high),
          low: currentPrice ? Math.min(parseFloat(low), currentPrice) : parseFloat(low),
          close: currentPrice || parseFloat(close),
          volume: parseFloat(volume),
          timestamp: parseInt(timestamp),
        };
        
        setCurrentCandle(candle);
      }
      
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching current candle:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [symbol, currentPrice]);

  useEffect(() => {
    if (!enabled || currentPrice === null) return;

    fetchCurrentCandle();
  }, [fetchCurrentCandle, enabled, currentPrice]);

  return {
    currentCandle,
    isLoading,
    error,
  };
};
