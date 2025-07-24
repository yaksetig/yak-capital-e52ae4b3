import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketIndicators {
  price?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  priceZScore?: number;
  volumeZScore?: number;
  rsiZScore?: number;
  atrZScore?: number;
}

interface AIMarketAnalysisData {
  id: string;
  ticker: string;
  analysis: string;
  created_at: string;
  updated_at: string;
}

export const useAIMarketAnalysis = (symbol: string, indicators: MarketIndicators) => {
  const [data, setData] = useState<AIMarketAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const { data: response, error } = await supabase.functions.invoke('fetch-market-analysis', {
        body: {
          ticker: symbol,
          indicators,
        },
      });

      if (error) {
        console.error('Error calling AI market analysis function:', error);
        setError('Failed to fetch AI analysis');
        return;
      }

      if (response?.error) {
        console.error('AI market analysis API error:', response.error);
        setError(response.error);
        return;
      }

      if (response?.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Error fetching AI market analysis:', err);
      setError('Failed to fetch AI analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  return { data, loading, error, refetch: fetchAnalysis };
};
