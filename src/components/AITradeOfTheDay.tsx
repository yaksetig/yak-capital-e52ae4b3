import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import AIRecommendationSection from './AIRecommendationSection';
import { useFearGreedIndex } from '../hooks/useFearGreedIndex';

const AITradeOfTheDay = () => {
  // We'll use BTC as default symbol for the AI Trade of the Day
  const symbol = 'BTCUSDT';
  
  // Fear and Greed Index for market context
  const { data: fearGreedData } = useFearGreedIndex();

  // Mock current price data - in a real app, you'd fetch this
  const mockMarketData = {
    price: 45000, // This would come from your price data
    change: 2.5,
    rsi: 65,
    macd: 'Bullish',
    fearGreed: fearGreedData?.value ? parseInt(fearGreedData.value) : 50,
    rank: fearGreedData?.value_classification === 'Extreme Fear' ? 1 : undefined,
    maStatus: 'Above SMA200',
    volume: 'High trading volume detected',
    levels: 'Key resistance at $46,500'
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AI Trade of the Day
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get AI-powered trading insights and recommendations based on advanced market analysis and technical indicators.
          </p>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-lg font-semibold">${mockMarketData.price.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">RSI</p>
                  <p className="text-lg font-semibold">{mockMarketData.rsi}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Sentiment</p>
                  <p className="text-lg font-semibold">
                    {fearGreedData?.value_classification || 'Neutral'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendation - Main Feature */}
        <AIRecommendationSection 
          symbol={symbol} 
          marketData={mockMarketData}
        />

        {/* Additional Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              How Our AI Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Technical Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes multiple technical indicators including RSI, MACD, moving averages, 
                  and volume patterns to identify trading opportunities.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Market Sentiment</h4>
                <p className="text-sm text-muted-foreground">
                  We incorporate market sentiment data, fear & greed index, and social signals 
                  to provide comprehensive market context.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Risk Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  Each recommendation includes a confidence score and risk analysis to help you 
                  make informed trading decisions.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Real-time Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Our analysis is updated regularly throughout the day to reflect changing 
                  market conditions and new data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                <Activity className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Important Disclaimer
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This AI analysis is for educational and informational purposes only. It is not financial advice. 
                  Cryptocurrency trading involves substantial risk of loss. Always conduct your own research and 
                  consider your risk tolerance before making any investment decisions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITradeOfTheDay;