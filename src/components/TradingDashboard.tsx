
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTradingData } from '@/hooks/useTradingData';

// Tab Components
import OverviewTab from './tabs/OverviewTab';
import TechnicalAnalysisTab from './tabs/TechnicalAnalysisTab';
import AITradeTab from './tabs/AITradeTab';
import NewsTab from './tabs/NewsTab';
import LearnTab from './tabs/LearnTab';

type TabType = 'overview' | 'technical' | 'ai' | 'news' | 'learn';

const TradingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [symbol] = useState('BTC');
  const [interval, setInterval] = useState('1d');
  const [timeRange, setTimeRange] = useState('90');

  const { rawData, chartData, indicators, loading, error } = useTradingData(symbol, interval, timeRange);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'technical' as TabType, label: 'Technical Analysis' },
    { id: 'ai' as TabType, label: 'AI Trade' },
    { id: 'news' as TabType, label: 'News' },
    { id: 'learn' as TabType, label: 'Learn' },
  ];

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
  };

  const tabProps = {
    rawData,
    chartData,
    indicators,
    loading,
    error,
    symbol,
    timeRange,
    interval,
    onTimeRangeChange: handleTimeRangeChange,
    onIntervalChange: handleIntervalChange,
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab {...tabProps} />;
      case 'technical':
        return <TechnicalAnalysisTab {...tabProps} />;
      case 'ai':
        return <AITradeTab symbol={symbol} indicators={indicators} chartData={chartData} />;
      case 'news':
        return <NewsTab symbol={symbol} />;
      case 'learn':
        return <LearnTab />;
      default:
        return <OverviewTab {...tabProps} />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Data</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Tab Navigation */}
        <Card className="p-1">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit ${
                  activeTab === tab.id ? "bg-gradient-primary text-primary-foreground" : ""
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Active Tab Content */}
        <div className="animate-in fade-in-50 duration-200">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
