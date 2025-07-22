
import React from 'react';
import { TabProps } from '@/types/trading';
import AIRecommendationSection from '@/components/AIRecommendationSection';

interface AITradeTabProps extends Pick<TabProps, 'symbol' | 'indicators' | 'chartData'> {}

const AITradeTab: React.FC<AITradeTabProps> = ({ symbol, indicators, chartData }) => {
  const latestData = chartData[chartData.length - 1];
  
  const marketData = {
    price: latestData?.price,
    rsi: indicators.rsi,
    macd: indicators.macd.macd !== null && indicators.macd.signal !== null 
      ? (indicators.macd.macd > indicators.macd.signal ? 'Bullish' : 'Bearish')
      : undefined,
    volume: latestData?.volume?.toString(),
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">AI Trading Assistant</h2>
        <p className="text-muted-foreground">
          Get AI-powered trading recommendations based on technical analysis and market sentiment.
        </p>
      </div>
      
      <AIRecommendationSection 
        symbol={symbol} 
        marketData={marketData}
      />
    </div>
  );
};

export default AITradeTab;
