
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NewsArticle {
  id?: string;
  ticker?: string;
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
  overall_sentiment_score: string;
  overall_sentiment_label: string;
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

const fetchNewsData = async (ticker: string): Promise<NewsArticle[]> => {
  console.log('Fetching news for ticker:', ticker);
  
  // Call our Supabase Edge Function using the supabase client
  const { data, error } = await supabase.functions.invoke('fetch-news', {
    body: { ticker: ticker.toUpperCase() },
  });
  
  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Failed to fetch news');
  }
  
  if (!Array.isArray(data)) {
    throw new Error('Invalid news data format');
  }
  
  return data;
};

export const useNewsData = (ticker: string) => {
  return useQuery({
    queryKey: ['news', ticker],
    queryFn: () => fetchNewsData(ticker),
    staleTime: 30 * 60 * 1000, // 30 minutes (longer since backend handles freshness)
    refetchInterval: 60 * 60 * 1000, // 1 hour
    enabled: !!ticker,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
