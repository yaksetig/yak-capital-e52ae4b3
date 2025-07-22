import { useState, useEffect } from 'react';

interface PriceDataPoint {
  date: string;
  price: number;
}

export const usePriceData = () => {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.prices || !Array.isArray(result.prices)) {
          throw new Error('Invalid price data format received');
        }
        
        const formattedData: PriceDataPoint[] = result.prices.map((item: [number, number]) => ({
          date: new Date(item[0]).toISOString().split('T')[0],
          price: item[1]
        }));
        
        setData(formattedData);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, []);

  return { data, loading, error };
};