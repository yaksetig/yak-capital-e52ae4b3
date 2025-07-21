
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AIRecommendationSection from '@/components/AIRecommendationSection';
import { Brain, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

interface AIInsightsTabProps {
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
  fearGreedData?: {
    value: number;
    classification: string;
    timestamp: string;
  };
}

const AIInsightsTab: React.FC<AIInsightsTabProps> = ({ 
  symbol, 
  marketData,
  fearGreedData 
}) => {
  const getMarketSentiment = () => {
    if (!fearGreedData) return { color: 'bg-gray-500', label: 'Unknown' };
    
    const value = fearGreedData.value;
    if (value <= 25) return { color: 'bg-red-500', label: 'Extreme Fear' };
    if (value <= 45) return { color: 'bg-orange-500', label: 'Fear' };
    if (value <= 55) return { color: 'bg-yellow-500', label: 'Neutral' };
    if (value <= 75) return { color: 'bg-green-500', label: 'Greed' };
    return { color: 'bg-green-600', label: 'Extreme Greed' };
  };

  const sentiment = getMarketSentiment();

  return (
    <div className="space-y-6">
      {/* AI Trading Recommendation */}
      <AIRecommendationSection symbol={symbol} marketData={marketData} />

      {/* Market Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Market Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fearGreedData ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fear & Greed Index</span>
                <div className="flex items-center gap-2">
                  <Badge className={`${sentiment.color} text-white`}>
                    {sentiment.label}
                  </Badge>
                  <span className="font-semibold text-lg">{fearGreedData.value}</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${sentiment.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${fearGreedData.value}%` }}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(fearGreedData.timestamp).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Sentiment data unavailable
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Signal Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Technical Signal Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">RSI Signal</span>
                <Badge variant="outline">
                  {marketData?.rsi ? `${marketData.rsi}` : 'N/A'}
                </Badge>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MACD Signal</span>
                <Badge variant="outline">
                  {marketData?.macd || 'N/A'}
                </Badge>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">MA Status</span>
                <Badge variant="outline">
                  {marketData?.maStatus || 'N/A'}
                </Badge>
              </div>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Volume</span>
                <Badge variant="outline">
                  {marketData?.volume || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Market Volatility</span>
              <Badge variant="outline">Moderate</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm">Trend Strength</span>
              <Badge variant="outline">
                {marketData?.levels || 'Analyzing...'}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
              ⚠️ Risk assessment is based on current market conditions and technical indicators. 
              Past performance does not guarantee future results.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsightsTab;
