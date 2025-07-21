import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIRecommendationData {
  id: string;
  ticker: string;
  recommendation: string;
  reasoning: string;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

interface MarketData {
  price?: number;
  change?: number;
  rsi?: number;
  macd?: string;
  fearGreed?: number;
  rank?: number;
  maStatus?: string;
  volume?: string;
  levels?: string;
}

export const useAIRecommendation = (symbol: string, marketData?: MarketData) => {
  const [data, setData] = useState<AIRecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIRecommendation = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: response, error } = await supabase.functions.invoke('fetch-ai-recommendation', {
        body: {
          ticker: symbol,
          marketData: marketData || {}
        }
      });

      if (error) {
        console.error('Error calling AI recommendation function:', error);
        setError('Failed to fetch AI recommendation');
        return;
      }

      if (response?.error) {
        console.error('AI recommendation API error:', response.error);
        setError(response.error);
        return;
      }

      if (response?.data) {
        setData(response.data);
      }

    } catch (err) {
      console.error('Error fetching AI recommendation:', err);
      setError('Failed to fetch AI recommendation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIRecommendation();
  }, [symbol]); // Only re-fetch when symbol changes

  return {
    data,
    loading,
    error,
    refetch: fetchAIRecommendation,
  };
};