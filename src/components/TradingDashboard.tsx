import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  Bar,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/card';
import NewsSection from '@/components/NewsSection';
import CycleAnalysisPanel from '@/components/CycleAnalysisPanel';
import CycleProjectionModal from '@/components/CycleProjectionModal';
import AIRecommendationSection from '@/components/AIRecommendationSection';
import MACDChart from '@/components/MACDChart';
import StochasticChart from '@/components/StochasticChart';
import ROCChart from '@/components/ROCChart';
import TimeSeriesMomentumChart from '@/components/TimeSeriesMomentumChart';
import IndependentM2Chart from '@/components/IndependentM2Chart';
import { MobileOptimizedLayout } from './MobileOptimizedLayout';
import { ResponsiveMetricsGrid } from './ResponsiveMetricsGrid';
import { MobileChartContainer } from './MobileChartContainer';
import { MobileTimeRangeSelector } from './MobileTimeRangeSelector';
import { MobileChartControls } from './MobileChartControls';
import { useIsMobile } from '@/hooks/use-mobile';

const TradingDashboard = () => {
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [btcPriceChange24h, setBtcPriceChange24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<number | null>(null);
  const [marketCap, setMarketCap] = useState<number | null>(null);
  const [fearGreedData, setFearGreedData] = useState<{ value: number; value_classification: string } | null>(null);
  const [latestM2, setLatestM2] = useState<number | null>(null);
  const [correlationCoefficient, setCorrelationCoefficient] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedCycleData, setSelectedCycleData] = useState(null);
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showEMA50, setShowEMA50] = useState(false);
  const [showBollingerBands, setShowBollingerBands] = useState(false);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showStochastic, setShowStochastic] = useState(false);
  const [showROC, setShowROC] = useState(false);
  const [showTSM, setShowTSM] = useState(false);
  const [showM2Chart, setShowM2Chart] = useState(false);
  const [showCycleAnalysis, setShowCycleAnalysis] = useState(false);
  const [chartHeight, setChartHeight] = useState(400);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceResponse = await axios.get('/api/btc-price');
        setBtcPrice(priceResponse.data.price);
        setBtcPriceChange24h(priceResponse.data.change24h);
        setVolume24h(priceResponse.data.volume24h);
        setMarketCap(priceResponse.data.marketCap);

        const fearGreedResponse = await axios.get('/api/fear-greed');
        setFearGreedData(fearGreedResponse.data);

        const m2Response = await axios.get('/api/m2-money-supply');
        setLatestM2(m2Response.data.latestM2);
        setCorrelationCoefficient(m2Response.data.correlationCoefficient);

        const chartResponse = await axios.get(`/api/btc-historical-data?range=${timeRange}`);
        setChartData(chartResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [timeRange]);

  const formatDate = (input: number | string) => {
    let date: Date;
    if (typeof input === 'number') {
      date = new Date(input);
    } else {
      date = new Date(input);
    }
    return date.toLocaleDateString();
  };

  const metricsData = [
    {
      title: "Bitcoin Price",
      value: btcPrice ? `$${btcPrice.toLocaleString()}` : 'Loading...',
      change: btcPriceChange24h ? `${btcPriceChange24h > 0 ? '+' : ''}${btcPriceChange24h.toFixed(2)}%` : undefined,
      trend: btcPriceChange24h ? (btcPriceChange24h > 0 ? 'up' as const : 'down' as const) : 'neutral' as const
    },
    {
      title: "24h Volume",
      value: volume24h ? `$${(volume24h / 1e9).toFixed(2)}B` : 'Loading...'
    },
    {
      title: "Market Cap",
      value: marketCap ? `$${(marketCap / 1e12).toFixed(2)}T` : 'Loading...'
    },
    {
      title: "Fear & Greed",
      value: fearGreedData?.value ? `${fearGreedData.value}` : 'Loading...',
      change: fearGreedData?.value_classification || undefined
    },
    {
      title: "M2 Money Supply",
      value: latestM2 ? `$${(latestM2 / 1e12).toFixed(1)}T` : 'Loading...'
    },
    {
      title: "Correlation",
      value: correlationCoefficient !== null ? correlationCoefficient.toFixed(3) : 'Loading...'
    }
  ];

  return (
    <MobileOptimizedLayout>
      <div className="space-y-4">
        <div className="text-center">
          <h1 className={`font-bold text-gradient-primary ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
            Yak Capital Dashboard
          </h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-lg'} mt-2`}>
            Bitcoin Analytics & Market Intelligence
          </p>
        </div>

        {/* Time Range Selector - Always visible */}
        <div className="flex justify-center">
          <MobileTimeRangeSelector
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
        </div>

        {/* Key Metrics Grid */}
        <ResponsiveMetricsGrid metrics={metricsData} />

        {/* Main Price Chart - Highest Priority */}
        <MobileChartContainer 
          title="Bitcoin Price Analysis" 
          priority="high"
          controls={
            <MobileChartControls
              chartHeight={chartHeight}
              onChartHeightChange={setChartHeight}
              visibleLines={{
                sma20: showSMA20,
                sma50: showSMA50,
                sma200: showSMA200,
                ema20: showEMA20,
                ema50: showEMA50,
                bbUpper: showBollingerBands,
                bbLower: showBollingerBands,
                vwap: showVWAP
              }}
              onLineVisibilityChange={(line, visible) => {
                switch(line) {
                  case 'sma20': setShowSMA20(visible); break;
                  case 'sma50': setShowSMA50(visible); break;
                  case 'sma200': setShowSMA200(visible); break;
                  case 'ema20': setShowEMA20(visible); break;
                  case 'ema50': setShowEMA50(visible); break;
                  case 'bbUpper':
                  case 'bbLower': setShowBollingerBands(visible); break;
                  case 'vwap': setShowVWAP(visible); break;
                }
              }}
              onZoomIn={() => console.log('Zoom in')}
              onZoomOut={() => console.log('Zoom out')}
              onResetZoom={() => console.log('Reset zoom')}
            />
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="time" tickFormatter={formatDate} />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip labelFormatter={(time) => formatDate(time as number)} />
              <Legend />
              <Area type="monotone" dataKey="price" fill="rgba(144, 202, 249, 0.1)" stroke="#8884d8" name="Price" />
              {showSMA20 && <Line type="monotone" dataKey="sma20" stroke="#e67e22" name="SMA 20" />}
              {showSMA50 && <Line type="monotone" dataKey="sma50" stroke="#2ecc71" name="SMA 50" />}
              {showSMA200 && <Line type="monotone" dataKey="sma200" stroke="#9b59b6" name="SMA 200" />}
              {showEMA20 && <Line type="monotone" dataKey="ema20" stroke="#3498db" name="EMA 20" />}
              {showEMA50 && <Line type="monotone" dataKey="ema50" stroke="#f1c40f" name="EMA 50" />}
              {showBollingerBands && (
                <>
                  <Line type="monotone" dataKey="bb_upper" stroke="#777" name="BB Upper" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="bb_lower" stroke="#777" name="BB Lower" strokeDasharray="3 3" />
                </>
              )}
              {showVWAP && <Line type="monotone" dataKey="vwap" stroke="#e74c3c" name="VWAP" />}
            </ComposedChart>
          </ResponsiveContainer>
        </MobileChartContainer>

        {/* Additional Charts - Collapsible on Mobile */}
        {showMACD && (
          <MobileChartContainer 
            title="MACD Analysis" 
            defaultCollapsed={isMobile}
            priority="medium"
          >
            <MACDChart 
              chartData={chartData} 
              chartHeight={isMobile ? 250 : chartHeight}
              formatDate={formatDate}
            />
          </MobileChartContainer>
        )}

        {showStochastic && (
          <MobileChartContainer 
            title="Stochastic Oscillator" 
            defaultCollapsed={isMobile}
            priority="medium"
          >
            <StochasticChart 
              chartData={chartData} 
              chartHeight={isMobile ? 250 : chartHeight}
              formatDate={formatDate}
            />
          </MobileChartContainer>
        )}

        {showROC && (
          <MobileChartContainer 
            title="Rate of Change (ROC)" 
            defaultCollapsed={isMobile}
            priority="low"
          >
            <ROCChart 
              chartData={chartData} 
              chartHeight={isMobile ? 250 : chartHeight}
              formatDate={formatDate}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </MobileChartContainer>
        )}

        {showTSM && (
          <MobileChartContainer 
            title="Time Series Momentum" 
            defaultCollapsed={isMobile}
            priority="low"
          >
            <TimeSeriesMomentumChart 
              chartData={chartData} 
              chartHeight={isMobile ? 250 : chartHeight}
              formatDate={formatDate}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </MobileChartContainer>
        )}

        {showM2Chart && (
          <MobileChartContainer 
            title="M2 Money Supply vs Bitcoin" 
            defaultCollapsed={isMobile}
            priority="medium"
          >
            <IndependentM2Chart />
          </MobileChartContainer>
        )}

        {/* Cycle Analysis Panel */}
        {showCycleAnalysis && (
          <MobileChartContainer 
            title="Advanced Cycle Analysis" 
            defaultCollapsed={isMobile}
            priority="low"
          >
            <CycleAnalysisPanel 
              cycles={[]}
              cycleStrength={0}
              isVisible={true}
            />
          </MobileChartContainer>
        )}

        {/* AI Recommendation - Always visible but smaller on mobile */}
        <AIRecommendationSection symbol="BTC" />

        {/* News Section - Collapsible on mobile */}
        <MobileChartContainer 
          title="Latest News" 
          defaultCollapsed={isMobile}
          priority="low"
        >
          <NewsSection symbol="BTC" />
        </MobileChartContainer>
      </div>

      {selectedCycleData && (
        <CycleProjectionModal
          isOpen={!!selectedCycleData}
          onClose={() => setSelectedCycleData(null)}
          cycleId={selectedCycleData}
        />
      )}
    </MobileOptimizedLayout>
  );
};

export default TradingDashboard;
