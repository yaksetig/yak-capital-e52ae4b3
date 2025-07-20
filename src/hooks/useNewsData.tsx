
import { useQuery } from '@tanstack/react-query';

interface NewsArticle {
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
}

interface NewsResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: NewsArticle[];
}

const ALPHA_VANTAGE_API_KEY = '4SXBRY6VC62LXW21';

const fetchNewsData = async (ticker: string): Promise<NewsArticle[]> => {
  const cryptoTicker = `CRYPTO:${ticker}`;
  const timeFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '') + 'T0000';
  
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${cryptoTicker}&time_from=${timeFrom}&limit=50&sort=RELEVANCE&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  console.log('Fetching news for ticker:', ticker);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`News API error: ${response.status}`);
  }
  
  const data: NewsResponse = await response.json();
  
  if (data.feed && Array.isArray(data.feed)) {
    return data.feed;
  }
  
  throw new Error('Invalid news data format');
};

export const useNewsData = (ticker: string) => {
  return useQuery({
    queryKey: ['news', ticker],
    queryFn: () => fetchNewsData(ticker),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    enabled: !!ticker,
  });
};
