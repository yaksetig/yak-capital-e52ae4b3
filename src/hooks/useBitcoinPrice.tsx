import { useState, useEffect } from 'react';

interface PriceDataPoint {
  timestamp: string;
  price: number;
  volume: number;
}

export const useBitcoinPrice = (timeRange: '1W' | '1M' | '3M' | '1Y') => {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBitcoinPrice = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Generate mock data for now - replace with real API call
        const days = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : 365;
        const mockData: PriceDataPoint[] = [];
        const now = new Date();
        const basePrice = 45000;
        
        for (let i = 0; i < days; i++) {
          const date = new Date(now.getTime() - (days - i) * 24 * 60 * 60 * 1000);
          const priceVariation = (Math.random() - 0.5) * 5000;
          mockData.push({
            timestamp: date.toISOString(),
            price: basePrice + priceVariation + (Math.sin(i / 10) * 2000),
            volume: Math.random() * 1000000000 + 500000000
          });
        }
        
        setData(mockData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBitcoinPrice();
  }, [timeRange]);

  return { data, loading, error };
};