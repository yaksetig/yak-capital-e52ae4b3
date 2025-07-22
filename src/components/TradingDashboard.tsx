import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TimeRangeSelector from './TimeRangeSelector';
import ChartControls from './ChartControls';
import InfoCard from './InfoCard';
import NewsSection from './NewsSection';
import AIRecommendationSection from './AIRecommendationSection';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';
import MACDChart from './MACDChart';
import StochasticChart from './StochasticChart';
import ROCChart from './ROCChart';
import IndependentM2Chart from './IndependentM2Chart';
import { useBitcoinTVLData } from '../hooks/useBitcoinTVLData';
import { useFearGreedIndex } from '../hooks/useFearGreedIndex';
import { useBinancePriceData } from '@/hooks/useBinancePriceData';

interface PriceDataPoint {
  date: string;
  price: number;
}

interface TVLDataPoint {
  date: string;
  tvl: number;
}

interface FearGreedDataPoint {
  date: string;
  value: number;
  classification: string;
}

// Utility functions for formatting
const formatPrice = (value: number) => `$${value.toLocaleString()}`;
const formatTVL = (value: number) => `$${(value / 1e9).toFixed(1)}B`;
const formatDate = (date: string) => new Date(date).toLocaleDateString();
const formatFearGreed = (value: number) => `${value}`;

const TradingDashboard = () => {
  // State variables
  const [timeRange, setTimeRange] = useState('60');
  const [chartHeight] = useState(400);
  const [selectedChart, setSelectedChart] = useState('momentum');
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAverageDays, setMovingAverageDays] = useState(20);

  // Data hooks
  const { data: tvlData, loading: tvlLoading, error: tvlError } = useBitcoinTVLData();
  const { data: fearGreedData, loading: fgLoading, error: fgError } = useFearGreedIndex();
  const { priceData, loading: priceLoading, error: priceError, fetchPriceData } = useBinancePriceData();

  // Fetch price data when timeRange changes
  React.useEffect(() => {
    fetchPriceData(timeRange);
  }, [timeRange]);

  // Calculate moving average
  const calculateMovingAverage = (data: PriceDataPoint[], days: number) => {
    return data.map((item, index) => {
      if (index < days - 1) return { ...item, movingAverage: null };
      const sum = data.slice(index - days + 1, index + 1).reduce((acc, curr) => acc + curr.price, 0);
      return { ...item, movingAverage: sum / days };
    });
  };

  const priceDataWithMovingAverage = useMemo(() => {
    return showMovingAverage ? calculateMovingAverage(priceData, movingAverageDays) : priceData;
  }, [priceData, showMovingAverage, movingAverageDays]);

  // Correlate Fear & Greed data with price data
  const correlatedFearGreedData = useMemo(() => {
    if (!priceData.length || !fearGreedData?.length) return [];

    const fearGreedMap = new Map(fearGreedData.map(item => [item.date, item]));

    return priceData.map(priceItem => {
      const fearGreedItem = fearGreedMap.get(priceItem.date);
      return {
        date: priceItem.date,
        price: priceItem.price,
        fearGreed: fearGreedItem ? fearGreedItem.value : null,
        fearGreedClassification: fearGreedItem ? fearGreedItem.classification : null,
      };
    });
  }, [priceData, fearGreedData]);

  // Correlate Bitcoin TVL data with price data
  const correlateTVLData = useMemo(() => {
    if (!priceData.length || !tvlData.length) return [];

    const tvlMap = new Map(tvlData.map(item => [item.date, item.tvl]));
    
    return priceData.map(priceItem => ({
      date: priceItem.date,
      price: priceItem.price,
      tvl: tvlMap.get(priceItem.date) || null
    }));
  }, [priceData, tvlData]);

  // Determine current Fear/Greed classification
  const currentFearGreed = fearGreedData && fearGreedData.length > 0 ? fearGreedData[fearGreedData.length - 1] : null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">Bitcoin Trading Dashboard</h1>
        <div className="flex items-center space-x-4">
          {fgLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          ) : (
            currentFearGreed && (
              <Badge variant="secondary">
                Fear & Greed Index: {formatFearGreed(currentFearGreed.value)} ({currentFearGreed.classification})
              </Badge>
            )
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard title="Current Price" value={priceData.length > 0 ? formatPrice(priceData[priceData.length - 1].price) : "Loading..."} loading={priceLoading} error={priceError} />
        <InfoCard title="Bitcoin TVL" value={tvlData && tvlData.length > 0 ? formatTVL(tvlData[tvlData.length - 1].tvl) : "Loading..."} loading={tvlLoading} error={tvlError} />
        <InfoCard title="Fear & Greed Index" value={currentFearGreed ? `${currentFearGreed.value} (${currentFearGreed.classification})` : "Loading..."} loading={fgLoading} error={fgError} />
      </div>

      {/* Price vs Bitcoin TVL Chart */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Price vs Bitcoin TVL</h2>
            {tvlLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          </div>
          <TimeRangeSelector 
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
        </div>
        
        {tvlError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Error loading TVL data: {tvlError.message}</p>
          </div>
        )}
        
        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={correlateTVLData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                yAxisId="price"
                orientation="left"
                tickFormatter={formatPrice}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                yAxisId="tvl"
                orientation="right"
                tickFormatter={formatTVL}
                stroke="hsl(var(--chart-2))"
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Price') return [formatPrice(Number(value)), name];
                  if (name === 'TVL') return [formatTVL(Number(value)), name];
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Legend />
              
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--foreground))" 
                strokeWidth={3} 
                name="Price" 
                dot={false} 
                isAnimationActive={false} 
              />
              
              {correlateTVLData.some(d => d.tvl) && (
                <Line 
                  yAxisId="tvl"
                  type="monotone" 
                  dataKey="tvl" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2} 
                  name="TVL" 
                  dot={false} 
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Independent M2 Chart */}
      <IndependentM2Chart />

      {/* Technical Analysis Charts */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Technical Analysis</h2>
            {priceLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          </div>
          <ChartControls
            selectedChart={selectedChart}
            onChartChange={setSelectedChart}
            showMovingAverage={showMovingAverage}
            onToggleMovingAverage={setShowMovingAverage}
            movingAverageDays={movingAverageDays}
            onMovingAverageDaysChange={setMovingAverageDays}
          />
        </div>

        {priceError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Error loading price data: {priceError.message}</p>
          </div>
        )}

        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
          {selectedChart === 'momentum' && (
            <TimeSeriesMomentumChart data={priceDataWithMovingAverage} />
          )}
          {selectedChart === 'macd' && (
            <MACDChart data={priceData} />
          )}
          {selectedChart === 'stochastic' && (
            <StochasticChart data={priceData} />
          )}
           {selectedChart === 'roc' && (
            <ROCChart data={priceData} />
          )}
        </div>
      </Card>

      {/* News and AI Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NewsSection />
        <AIRecommendationSection />
      </div>

      {/* Cycle Analysis Panel */}
      <CycleAnalysisPanel />
    </div>
  );
};

export default TradingDashboard;
