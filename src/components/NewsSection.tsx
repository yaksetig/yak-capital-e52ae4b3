
import React from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink, TrendingUp, TrendingDown, Calendar, AlertCircle, Database } from 'lucide-react';
import { useNewsData } from '../hooks/useNewsData';

interface NewsSectionProps {
  symbol: string;
}

const NewsSection: React.FC<NewsSectionProps> = ({ symbol }) => {
  const ticker = symbol?.replace('USDT', '') || 'BTC'; // Convert BTCUSDT to BTC, with fallback
  const { data: newsData, isLoading, error } = useNewsData(ticker);

  const getSentimentColor = (sentiment: string) => {
    if (sentiment?.toLowerCase().includes('positive')) return 'text-bullish';
    if (sentiment?.toLowerCase().includes('negative')) return 'text-bearish';
    return 'text-neutral';
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment?.toLowerCase().includes('positive')) return TrendingUp;
    if (sentiment?.toLowerCase().includes('negative')) return TrendingDown;
    return AlertCircle;
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle both database timestamp and Alpha Vantage formats
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        // Try Alpha Vantage format: YYYYMMDDTHHMMSS
        if (dateString.includes('T') && dateString.length === 15) {
          const year = dateString.substring(0, 4);
          const month = dateString.substring(4, 6);
          const day = dateString.substring(6, 8);
          const hour = dateString.substring(9, 11);
          const minute = dateString.substring(11, 13);
          
          const isoString = `${year}-${month}-${day}T${hour}:${minute}:00`;
          const parsedDate = new Date(isoString);
          
          return parsedDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const isFromCache = (article: any) => {
    return article.created_at || article.id; // Database articles have these fields
  };

  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <ExternalLink className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Market News & Sentiment</h2>
        <span className="text-sm text-muted-foreground">({ticker})</span>
        {newsData && newsData.length > 0 && isFromCache(newsData[0]) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="w-3 h-3" />
            <span>Cached</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading latest news...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-2">Failed to load news</p>
          <p className="text-sm text-muted-foreground">{error?.message || 'Unknown error'}</p>
        </div>
      )}

      {newsData && newsData.length > 0 && (
        <div className="grid gap-4">
          {newsData.slice(0, 6).map((article, index) => {
            const SentimentIcon = getSentimentIcon(article.overall_sentiment_label);
            
            return (
              <div
                key={article.id || article.url || index}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {article.summary}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(article.time_published)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="font-medium">{article.source}</span>
                      </div>
                      
                      {article.overall_sentiment_score && (
                        <div className="flex items-center gap-1">
                          <SentimentIcon className="w-3 h-3" />
                          <span className={`font-medium ${getSentimentColor(article.overall_sentiment_label)}`}>
                            {article.overall_sentiment_label}
                          </span>
                          <span className="text-muted-foreground">
                            ({(parseFloat(article.overall_sentiment_score) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {newsData && newsData.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No recent news found for {ticker}</p>
        </div>
      )}
    </Card>
  );
};

export default NewsSection;
