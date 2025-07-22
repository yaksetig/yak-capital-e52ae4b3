import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { useBitcoinTVLData } from '@/hooks/useBitcoinTVLData';
import { useFearGreedIndex } from '@/hooks/useFearGreedIndex';
import { useAIRecommendation } from '@/hooks/useAIRecommendation';
import { useNewsData } from '@/hooks/useNewsData';
import NewsSection from './NewsSection';
import AIRecommendationSection from './AIRecommendationSection';
import InfoCard from './InfoCard';
import TimeRangeSelector from './TimeRangeSelector';
import ChartControls from './ChartControls';
import CycleAnalysisPanel from './CycleAnalysisPanel';
import IndependentM2Chart from './IndependentM2Chart';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';
import MACDChart from './MACDChart';
import ROCChart from './ROCChart';
import StochasticChart from './StochasticChart';

const TradingDashboard = () => {
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '1Y'>('1M');
  const [selectedChart, setSelectedChart] = useState<'price' | 'momentum' | 'macd' | 'roc' | 'stochastic'>('price');
  
  // Bitcoin price and TVL data
  const { data: priceData, loading: priceLoading, error: priceError } = useBitcoinPrice(timeRange);
  const { data: tvlData, loading: tvlLoading, error: tvlError } = useBitcoinTVLData();
  
  // Other data hooks
  const { data: fearGreedData } = useFearGreedIndex();
  const { data: aiRecommendation } = useAIRecommendation();
  const { data: newsData } = useNewsData();

  // Correlate price data with TVL data
  const correlatedData = priceData.map(pricePoint => {
    const matchingTVL = tvlData.find(tvlPoint => 
      format(new Date(pricePoint.timestamp), 'yyyy-MM-dd') === format(new Date(tvlPoint.date), 'yyyy-MM-dd')
    );
    
    return {
      ...pricePoint,
      tvl: matchingTVL?.tvl || null
    };
  }).filter(point => point.tvl !== null);

  const formatPrice = (value: number) => `$${value.toLocaleString()}`;
  const formatTVL = (value: number) => `$${(value / 1e9).toFixed(1)}B`;
  const formatNumber = (value: number) => value.toLocaleString();

  if (priceLoading || tvlLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-lg">Loading market data...</div>
      </div>
    );
  }

  if (priceError || tvlError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-lg text-red-600">
          Error loading data: {priceError?.message || tvlError?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-800">Bitcoin Trading Dashboard</h1>
          <p className="text-slate-600">Advanced market analysis and insights</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            title="Current Price"
            value={priceData.length > 0 ? formatPrice(priceData[priceData.length - 1].price) : 'Loading...'}
            change={priceData.length > 1 ? 
              ((priceData[priceData.length - 1].price - priceData[priceData.length - 2].price) / priceData[priceData.length - 2].price * 100).toFixed(2) + '%' 
              : '0%'}
          />
          <InfoCard
            title="24h Volume"
            value={priceData.length > 0 ? formatNumber(priceData[priceData.length - 1].volume) : 'Loading...'}
            change="Volume"
          />
          <InfoCard
            title="Fear & Greed"
            value={fearGreedData ? fearGreedData.value.toString() : 'Loading...'}
            change={fearGreedData ? fearGreedData.classification : 'Loading...'}
          />
          <InfoCard
            title="Current TVL"
            value={tvlData.length > 0 ? formatTVL(tvlData[tvlData.length - 1].tvl) : 'Loading...'}
            change="Bitcoin L2s"
          />
        </div>

        {/* Chart Controls */}
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <TimeRangeSelector timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          <ChartControls selectedChart={selectedChart} onChartChange={setSelectedChart} />
        </div>

        {/* Main Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Price vs Bitcoin TVL</CardTitle>
            <CardDescription>Bitcoin price correlation with Total Value Locked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={correlatedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis yAxisId="left" tickFormatter={formatPrice} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={formatTVL} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    formatter={(value, name) => [
                      name === 'price' ? formatPrice(Number(value)) : formatTVL(Number(value)),
                      name === 'price' ? 'Bitcoin Price' : 'Bitcoin TVL'
                    ]}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="price" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Bitcoin Price"
                    dot={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tvl" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Bitcoin TVL"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Additional Charts */}
        {selectedChart === 'momentum' && <TimeSeriesMomentumChart />}
        {selectedChart === 'macd' && <MACDChart />}
        {selectedChart === 'roc' && <ROCChart />}
        {selectedChart === 'stochastic' && <StochasticChart />}

        {/* Independent M2 Chart */}
        <IndependentM2Chart />

        {/* Cycle Analysis */}
        <CycleAnalysisPanel />

        {/* AI Recommendation */}
        <AIRecommendationSection recommendation={aiRecommendation} />

        {/* News Section */}
        <NewsSection news={newsData} />
      </div>
    </div>
  );
};

export default TradingDashboard;
