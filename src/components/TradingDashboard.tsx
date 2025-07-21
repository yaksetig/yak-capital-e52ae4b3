
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useM2GlobalData } from '@/hooks/useM2GlobalData';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';
import { useProcessedChartData } from '@/hooks/useProcessedChartData';
import TimeRangeSelector from './TimeRangeSelector';
import InfoCard from './InfoCard';
import NewsSection from './NewsSection';
import PriceChart from './charts/PriceChart';
import RSIChart from './charts/RSIChart';
import CCIChart from './charts/CCIChart';
import ZScoreChart from './charts/ZScoreChart';
import ADXChart from './charts/ADXChart';
import StochasticChart from './StochasticChart';
import MACDChart from './MACDChart';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';
import ChartControls from './ChartControls';
import CycleProjectionModal from './CycleProjectionModal';

const TradingDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('90');
  const [chartHeight, setChartHeight] = useState(500);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  // Data hooks
  const { data: m2Data, loading: m2Loading, error: m2Error } = useM2GlobalData();
  const { data: fearGreedData, loading: fearGreedLoading } = useFearGreedIndex();

  // Generate mock Bitcoin price data
  const rawData = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 365);
    
    const data = [];
    let currentPrice = 45000;
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const change = (Math.random() - 0.5) * 0.05;
      currentPrice *= (1 + change);
      
      data.push({
        timestamp: Math.floor(date.getTime() / 1000),
        price: currentPrice,
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  }, []);

  // Process chart data
  const { processedData, filteredData } = useProcessedChartData(rawData);
  const chartData = filteredData(selectedTimeRange);

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd');
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // Get latest values for info cards
  const latestData = chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const latestPrice = latestData?.price || 0;
  const latestRSI = latestData?.rsi || 0;
  const latestCCI = latestData?.cci || 0;
  const latestZScore = latestData?.zScore || 0;

  // Price change calculation
  const priceChange = chartData && chartData.length > 1 ? 
    ((latestPrice - chartData[0].price) / chartData[0].price) * 100 : 0;

  // Fear & Greed interpretation
  const getFearGreedStatus = (value: number) => {
    if (value <= 25) return 'Extreme Fear';
    if (value <= 45) return 'Fear';
    if (value <= 55) return 'Neutral';
    if (value <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  const fearGreedValue = fearGreedData ? parseInt(fearGreedData.value) : 50;
  const fearGreedStatus = getFearGreedStatus(fearGreedValue);

  // Handle cycle modal
  const handleCycleClick = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCycleId(null);
  };

  if (m2Loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading market data...</div>
      </div>
    );
  }

  if (m2Error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Error loading data: {m2Error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bitcoin Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time market analysis with technical indicators and sentiment data
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <TimeRangeSelector 
            selectedRange={selectedTimeRange} 
            onRangeChange={setSelectedTimeRange}
          />
          <div className="text-sm text-muted-foreground">
            Chart Height: {chartHeight}px
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard
          title="Bitcoin Price"
          shortDescription={`$${latestPrice.toFixed(2)} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`}
          detailedExplanation="Current Bitcoin price with percentage change from the selected time period."
          tradingTip="Look for strong support/resistance levels when price approaches key psychological levels."
        />
        <InfoCard
          title="RSI (14)"
          shortDescription={`${latestRSI.toFixed(2)} - ${latestRSI > 70 ? 'Overbought' : latestRSI < 30 ? 'Oversold' : 'Neutral'}`}
          detailedExplanation="Relative Strength Index measures momentum. Values above 70 indicate overbought conditions, below 30 indicate oversold."
          tradingTip="RSI divergence with price can signal potential reversal points."
        />
        <InfoCard
          title="Fear & Greed Index"
          shortDescription={`${fearGreedValue} - ${fearGreedStatus}`}
          detailedExplanation="Market sentiment indicator ranging from 0 (Extreme Fear) to 100 (Extreme Greed)."
          tradingTip="Extreme fear often presents buying opportunities, while extreme greed suggests caution."
        />
        <InfoCard
          title="Z-Score"
          shortDescription={`${latestZScore.toFixed(3)} - ${Math.abs(latestZScore) > 2 ? 'Extreme' : 'Normal'}`}
          detailedExplanation="Statistical measure showing how many standard deviations the current price is from the mean."
          tradingTip="Z-scores beyond ±2 suggest price is statistically extreme and may revert to mean."
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 gap-6">
        <PriceChart 
          data={chartData} 
          formatDate={formatDate} 
          height={chartHeight} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RSIChart 
            data={chartData} 
            formatDate={formatDate} 
            height={chartHeight * 0.7} 
          />
          <CCIChart 
            data={chartData} 
            formatDate={formatDate} 
            height={chartHeight * 0.7} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ZScoreChart 
            data={chartData} 
            formatDate={formatDate} 
            height={chartHeight * 0.7} 
          />
          <ADXChart 
            data={chartData} 
            formatDate={formatDate} 
            height={chartHeight * 0.7} 
          />
        </div>

        <StochasticChart 
          chartData={chartData} 
          chartHeight={chartHeight} 
          formatDate={formatDate} 
        />
        
        <MACDChart 
          chartData={chartData} 
          chartHeight={chartHeight} 
          formatDate={formatDate} 
        />
        
        <TimeSeriesMomentumChart 
          chartData={chartData} 
          chartHeight={chartHeight} 
          formatDate={formatDate}
          timeRange={selectedTimeRange}
          onTimeRangeChange={setSelectedTimeRange}
        />
      </div>

      {/* News Section */}
      <NewsSection symbol="BTC" />

      {/* Cycle Projection Modal */}
      <CycleProjectionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        cycleId={selectedCycleId}
      />
    </div>
  );
};

export default TradingDashboard;
