
import { useState, useEffect, useCallback } from 'react';

interface RealtimePriceData {
  symbol: string;
  price: string;
}

interface UseRealtimePriceReturn {
  currentPrice: number | null;
  previousPrice: number | null;
  priceChange: number;
  priceChangePercent: number;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export const useRealtimePrice = (symbol: string = 'BTCUSDT', enabled: boolean = true): UseRealtimePriceReturn => {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RealtimePriceData = await response.json();
      const newPrice = parseFloat(data.price);
      
      setCurrentPrice(prevPrice => {
        if (prevPrice !== null && prevPrice !== newPrice) {
          setPreviousPrice(prevPrice);
        }
        return newPrice;
      });
      
      setLastUpdate(new Date());
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching real-time price:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchPrice();

    // Set up interval for regular updates (every 10 seconds)
    const interval = setInterval(fetchPrice, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchPrice, enabled]);

  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : 0;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

  return {
    currentPrice,
    previousPrice,
    priceChange,
    priceChangePercent,
    isLoading,
    error,
    lastUpdate,
  };
};
