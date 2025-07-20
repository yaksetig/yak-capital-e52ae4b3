
import { useState, useEffect } from 'react';

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update: string;
}

interface FearGreedResponse {
  name: string;
  data: FearGreedData[];
  metadata: {
    error: string | null;
  };
}

export const useFearGreedIndex = () => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFearGreedIndex = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://api.alternative.me/fng/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: FearGreedResponse = await response.json();
      
      if (result.metadata.error) {
        throw new Error(result.metadata.error);
      }
      
      if (result.data && result.data.length > 0) {
        setData(result.data[0]);
      } else {
        throw new Error('No data available');
      }
    } catch (err) {
      setError(`Failed to fetch Fear & Greed Index: ${err.message}`);
      console.error('Error fetching Fear & Greed Index:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFearGreedIndex();
  }, []);

  return { data, loading, error, refetch: fetchFearGreedIndex };
};
