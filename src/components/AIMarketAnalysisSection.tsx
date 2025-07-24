import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Brain, Clock } from 'lucide-react';
import { useAIMarketAnalysis, MarketIndicators } from '@/hooks/useAIMarketAnalysis';

interface Props {
  symbol: string;
  indicators: MarketIndicators;
}

const AIMarketAnalysisSection: React.FC<Props> = ({ symbol, indicators }) => {
  const { data, loading, error } = useAIMarketAnalysis(symbol, indicators);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  return (
    <Card className="my-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Market Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {data.analysis}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Generated {formatTimeAgo(data.created_at)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No AI analysis available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIMarketAnalysisSection;
