import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react';
import { useAIRecommendation } from '@/hooks/useAIRecommendation';

interface AIRecommendationSectionProps {
  symbol: string;
  marketData?: {
    price?: number;
    change?: number;
    rsi?: number;
    macd?: string;
    fearGreed?: number;
    rank?: number;
    maStatus?: string;
    volume?: string;
    levels?: string;
  };
}

const AIRecommendationSection: React.FC<AIRecommendationSectionProps> = ({ 
  symbol, 
  marketData 
}) => {
  const { data, loading, error } = useAIRecommendation(symbol, marketData);

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation?.toUpperCase()) {
      case 'BUY':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'SELL':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'HOLD':
      default:
        return <Minus className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation?.toUpperCase()) {
      case 'BUY':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'SELL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'HOLD':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          AI Recommended Trade
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
            {/* Recommendation Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRecommendationIcon(data.recommendation)}
                <Badge className={getRecommendationColor(data.recommendation)}>
                  {data.recommendation}
                </Badge>
              </div>
              {data.confidence_score && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Confidence: </span>
                  <span className={`font-semibold ${getConfidenceColor(data.confidence_score)}`}>
                    {data.confidence_score}/10
                  </span>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {data.reasoning}
              </p>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Generated {formatTimeAgo(data.created_at)}</span>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
              ⚠️ This is AI-generated analysis and should not be considered as financial advice. 
              Always do your own research before making investment decisions.
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No AI recommendation available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendationSection;