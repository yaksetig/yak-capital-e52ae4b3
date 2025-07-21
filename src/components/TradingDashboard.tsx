import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ChartControls from './ChartControls';
import InfoCard from './InfoCard';
import MACDChart from './MACDChart';
import StochasticChart from './StochasticChart';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import CycleProjectionModal from './CycleProjectionModal';
import NewsSection from './NewsSection';
import TimeRangeSelector from './TimeRangeSelector';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';
import { useNewsData } from '@/hooks/useNewsData';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  ReferenceLine 
} from 'recharts';

// Mock data for BTC with SMA calculations
const generateMockData = (days: number) => {
  const data = [];
  const basePrice = 42000;
  let currentPrice = basePrice;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    
    // Simple price movement simulation
    const change = (Math.random() - 0.5) * 0.05; // ±2.5% change
    currentPrice = currentPrice * (1 + change);
    
    const volume = Math.random() * 50000 + 10000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
      price: currentPrice,
      volume: volume,
      high: currentPrice * 1.02,
      low: currentPrice * 0.98,
      open: currentPrice * (Math.random() * 0.02 + 0.99),
      close: currentPrice
    });
  }
  
  // Calculate SMAs for the full dataset
  return data.map((item, index) => {
    const prices = data.slice(0, index + 1).map(d => d.price);
    
    return {
      ...item,
      sma20: index >= 19 ? prices.slice(-20).reduce((a, b) => a + b, 0) / 20 : null,
      sma50: index >= 49 ? prices.slice(-50).reduce((a, b) => a + b, 0) / 50 : null,
      sma200: index >= 199 ? prices.slice(-200).reduce((a, b) => a + b, 0) / 200 : null,
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 1000,
      macdSignal: (Math.random() - 0.5) * 800,
      vwap: currentPrice * (Math.random() * 0.02 + 0.99)
    };
  });
};

interface TradingDashboardProps {
  symbol?: string;
}

const TradingDashboard: React.FC<TradingDashboardProps> = ({ symbol = 'BTC' }) => {
  const [timeRange, setTimeRange] = useState('60');
  const [showCycleProjections, setShowCycleProjections] = useState(false);
  
  // Chart controls state
  const [yAxisPadding, setYAxisPadding] = useState(10);
  const [autoFit, setAutoFit] = useState(true);
  const [minPrice, setMinPrice] = useState<number>();
  const [maxPrice, setMaxPrice] = useState<number>();
  const [chartHeight, setChartHeight] = useState(400);
  const [visibleLines, setVisibleLines] = useState({
    sma20: true,
    sma50: true,
    sma200: true,
    vwap: false
  });
  const [showCycleAnalysis, setShowCycleAnalysis] = useState(false);
  
  const { data: fearGreedData } = useFearGreedIndex();
  const { data: newsData } = useNewsData('BTC');
  
  // Generate data based on time range
  const getDaysToShow = (range: string) => {
    switch(range) {
      case '7': return 7;
      case '30': return 30;
      case '60': return 60;
      case '90': return 90;
      case 'all': return 201; // Full dataset
      default: return 60;
    }
  };
  
  const fullData = generateMockData(201); // Always generate 201 days for SMA200
  const daysToShow = getDaysToShow(timeRange);
  const chartData = fullData.slice(-daysToShow);
  
  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const priceChange = chartData.length > 1 ? 
    ((currentPrice - chartData[chartData.length - 2].price) / chartData[chartData.length - 2].price) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Chart Section */}
        <div className="lg:w-2/3 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">{symbol}/USD</CardTitle>
                <CardDescription>
                  ${currentPrice.toFixed(2)} 
                  <span className={`ml-2 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </CardDescription>
              </div>
              <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
            </CardHeader>
            <CardContent>
              <ChartControls
                yAxisPadding={yAxisPadding}
                onYAxisPaddingChange={setYAxisPadding}
                autoFit={autoFit}
                onAutoFitChange={setAutoFit}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceRangeChange={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                }}
                chartHeight={chartHeight}
                onChartHeightChange={setChartHeight}
                visibleLines={visibleLines}
                onLineVisibilityChange={(line, visible) => {
                  setVisibleLines(prev => ({ ...prev, [line]: visible }));
                }}
                showCycleAnalysis={showCycleAnalysis}
                onCycleAnalysisChange={setShowCycleAnalysis}
                onZoomIn={() => {}}
                onZoomOut={() => {}}
                onResetZoom={() => {}}
                onFocusRecent={() => {}}
              />
              <div className="h-96 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis 
                      domain={['dataMin - 1000', 'dataMax + 1000']} 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'price' ? `$${value.toFixed(2)}` : value?.toFixed(2),
                        name.toUpperCase()
                      ]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    {visibleLines.sma20 && (
                      <Line 
                        type="monotone" 
                        dataKey="sma20" 
                        stroke="#ff7c7c" 
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls={false}
                      />
                    )}
                    {visibleLines.sma50 && (
                      <Line 
                        type="monotone" 
                        dataKey="sma50" 
                        stroke="#ffd93d" 
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls={false}
                      />
                    )}
                    {visibleLines.sma200 && (
                      <Line 
                        type="monotone" 
                        dataKey="sma200" 
                        stroke="#6bcf7f" 
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                        connectNulls={false}
                      />
                    )}
                    {visibleLines.vwap && (
                      <Line 
                        type="monotone" 
                        dataKey="vwap" 
                        stroke="#9333ea" 
                        strokeWidth={1}
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* MACD Chart */}
          <MACDChart 
            chartData={chartData} 
            chartHeight={chartHeight}
            formatDate={(date) => new Date(date).toLocaleDateString()}
          />

          {/* Stochastic Chart */}
          <StochasticChart 
            chartData={chartData} 
            chartHeight={chartHeight}
            formatDate={(date) => new Date(date).toLocaleDateString()}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3 space-y-4">
          <InfoCard 
            title="Market Overview"
            shortDescription="Real-time market indicators and analysis"
            detailedExplanation="This overview shows key market metrics including price action, volume, and fear & greed index to help assess market sentiment."
            tradingTip={`Current price: $${currentPrice.toFixed(2)} with ${priceChange >= 0 ? 'positive' : 'negative'} momentum`}
          />
          
          <CycleAnalysisPanel 
            cycles={[]}
            cycleStrength={0.75}
            isVisible={showCycleAnalysis}
          />
          
          <NewsSection symbol="BTC" />
        </div>
      </div>

      <CycleProjectionModal 
        isOpen={showCycleProjections}
        onClose={() => setShowCycleProjections(false)}
        cycleId={null}
      />
    </div>
  );
};

export default TradingDashboard;