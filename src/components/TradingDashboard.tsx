
import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Brain, Newspaper } from 'lucide-react';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';
import { useBitcoinTVLData } from '@/hooks/useBitcoinTVLData';
import OverviewTab from '@/components/tabs/OverviewTab';
import TechnicalAnalysisTab from '@/components/tabs/TechnicalAnalysisTab';
import AIInsightsTab from '@/components/tabs/AIInsightsTab';
import MarketNewsTab from '@/components/tabs/MarketNewsTab';

// Sample data - in a real app this would come from your data hooks
const generateSampleData = () => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 100);
  
  for (let i = 0; i < 100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const basePrice = 45000 + Math.sin(i * 0.1) * 5000 + Math.random() * 2000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: basePrice,
      open: basePrice * (0.99 + Math.random() * 0.02),
      high: basePrice * (1.01 + Math.random() * 0.02),
      low: basePrice * (0.97 + Math.random() * 0.02),
      close: basePrice,
      volume: Math.floor(1000000 + Math.random() * 500000),
      rsi: 30 + Math.random() * 40,
      macd: Math.random() * 200 - 100,
      macdSignal: Math.random() * 200 - 100,
      macdHistogram: Math.random() * 100 - 50,
      bollingerUpper: basePrice * 1.05,
      bollingerMiddle: basePrice,
      bollingerLower: basePrice * 0.95,
      stochK: Math.random() * 100,
      stochD: Math.random() * 100,
      roc: Math.random() * 20 - 10
    });
  }
  
  return data;
};

const TradingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('1Y');
  const [showCycleAnalysis, setShowCycleAnalysis] = useState(false);
  
  // Data hooks
  const { data: fearGreedData } = useFearGreedIndex();
  const { data: bitcoinTVLData } = useBitcoinTVLData();
  
  // Sample data
  const chartData = useMemo(() => generateSampleData(), []);
  const chartHeight = 400;
  const symbol = 'BTCUSDT';
  
  // Format date function
  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);
  
  // Calculate current market data
  const currentData = chartData[chartData.length - 1];
  const marketData = useMemo(() => {
    if (!currentData) return {
      currentPrice: 'Loading...',
      rsi: 'Loading...',
      stochastic: 'Loading...',
      adx: 'Loading...',
      priceZScore: 'Loading...',
      fearGreed: 'Loading...'
    };
    
    return {
      currentPrice: `$${currentData.price.toLocaleString()}`,
      rsi: currentData.rsi.toFixed(1),
      stochastic: `${currentData.stochK.toFixed(1)} / ${currentData.stochD.toFixed(1)}`,
      adx: (Math.random() * 60 + 20).toFixed(1),
      priceZScore: (Math.random() * 4 - 2).toFixed(2),
      fearGreed: fearGreedData?.value?.toString() || 'N/A'
    };
  }, [currentData, fearGreedData]);
  
  // Calculate moving averages
  const movingAverages = useMemo(() => {
    if (!currentData) return [];
    
    const periods = [20, 50, 100, 200];
    return periods.map(period => {
      const value = currentData.price * (0.95 + Math.random() * 0.1);
      const distance = ((currentData.price - value) / value) * 100;
      const signal = distance > 2 ? 'Bullish' : distance < -2 ? 'Bearish' : 'Neutral';
      
      return { period, value, distance, signal };
    });
  }, [currentData]);
  
  // Sample cycle data
  const cycles = [
    { name: 'Bitcoin Halving Cycle', daysRemaining: 365, strength: 8.5, phase: 'Accumulation' },
    { name: 'Market Cycle', daysRemaining: 180, strength: 7.2, phase: 'Growth' },
    { name: 'Seasonal Pattern', daysRemaining: 45, strength: 6.8, phase: 'Peak' }
  ];
  
  const cycleStrength = 7.5;
  
  // AI market data for insights
  const aiMarketData = {
    price: currentData?.price,
    change: 2.5,
    rsi: currentData?.rsi,
    macd: currentData?.macd > currentData?.macdSignal ? 'Bullish' : 'Bearish',
    fearGreed: fearGreedData?.value ? parseInt(fearGreedData.value, 10) : 0,
    rank: 1,
    maStatus: 'Above 20MA',
    volume: 'High',
    levels: 'Strong Support'
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Bitcoin Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive technical analysis and market insights for Bitcoin (BTC/USDT)
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Technical Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">Market News</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab
              chartData={chartData}
              chartHeight={chartHeight}
              formatDate={formatDate}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              marketData={marketData}
              movingAverages={movingAverages}
              cycles={cycles}
              cycleStrength={cycleStrength}
              showCycleAnalysis={showCycleAnalysis}
            />
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <TechnicalAnalysisTab
              chartData={chartData}
              chartHeight={chartHeight}
              formatDate={formatDate}
              rsiData={chartData}
              cciData={chartData}
              adxData={chartData}
              priceZScoreData={chartData}
              volumeZScoreData={chartData}
              bitcoinTVLData={bitcoinTVLData || []}
            />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-6">
            <AIInsightsTab
              symbol={symbol}
              marketData={aiMarketData}
              fearGreedData={fearGreedData ? { value: parseInt(fearGreedData.value, 10), classification: 'Unknown', timestamp: new Date().toISOString() } : undefined}
            />
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <MarketNewsTab symbol={symbol} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TradingDashboard;
