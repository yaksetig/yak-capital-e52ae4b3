import React, { useState, useMemo } from 'react';
import { ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBitcoinTVLData } from '@/hooks/useBitcoinTVLData';
import { useM2GlobalData } from '@/hooks/useM2GlobalData';
import ChartControls from './ChartControls';
import TimeRangeSelector from './TimeRangeSelector';
import { calculateCorrelation, getCorrelationInfo } from '@/utils/correlation';
import MACDChart from './MACDChart';
import StochasticChart from './StochasticChart';
import ROCChart from './ROCChart';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';
import IndependentM2Chart from './IndependentM2Chart';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const TradingDashboard = () => {
  const [selectedChart, setSelectedChart] = useState('price');
  const [isTVLChart, setIsTVLChart] = useState(false);
  const [isM2Chart, setIsM2Chart] = useState(false);
  const [selectedRange, setSelectedRange] = useState('1y');
  const [chartHeight, setChartHeight] = useState(400);
  const [showMACD, setShowMACD] = useState(false);
  const [showStochastic, setShowStochastic] = useState(false);
  const [showROC, setShowROC] = useState(false);
  const [showTSM, setShowTSM] = useState(false);
  const [showM2, setShowM2] = useState(false);

  const { data: bitcoinTVLData, loading: bitcoinTVLLoading } = useBitcoinTVLData();
  const { data: m2Data, loading: m2Loading } = useM2GlobalData();

  const handleChartChange = (chartType: string) => {
    setSelectedChart(chartType);
  };

  const toggleTVLChart = () => {
    setIsTVLChart(!isTVLChart);
  };

  const toggleM2Chart = () => {
    setIsM2Chart(!isM2Chart);
  };

  const processedData = useMemo(() => {
    if (!bitcoinTVLData || bitcoinTVLData.length === 0) return [];
    
    return bitcoinTVLData.map(item => ({
      date: item.date,
      btcPrice: item.btcPrice,
      tvl: item.tvl,
      volume: item.volume,
      high: item.high,
      low: item.low,
      close: item.close,
      open: item.open,
      marketCap: item.marketCap,
      stochK: item.stochK,
      stochD: item.stochD,
      macd: item.macd,
      macdSignal: item.macdSignal,
      macdHistogram: item.macdHistogram,
      roc: item.roc,
      tsm: item.tsm
    }));
  }, [bitcoinTVLData]);

  const filteredChartData = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (selectedRange) {
      case '1w':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '2y':
        startDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        return processedData;
    }
    
    return processedData.filter(item => new Date(item.date) >= startDate);
  }, [processedData, selectedRange]);

  const btcTvlCorrelation = useMemo(() => {
    if (!filteredChartData || filteredChartData.length === 0) return null;
    
    const btcPrices = filteredChartData
      .map(d => d.btcPrice)
      .filter(price => price !== null && price !== undefined && !isNaN(price));
    
    const tvlValues = filteredChartData
      .map(d => d.tvl)
      .filter(tvl => tvl !== null && tvl !== undefined && !isNaN(tvl));
    
    if (btcPrices.length === 0 || tvlValues.length === 0 || btcPrices.length !== tvlValues.length) {
      return null;
    }
    
    return calculateCorrelation(btcPrices, tvlValues);
  }, [filteredChartData]);

  const correlationInfo = getCorrelationInfo(btcTvlCorrelation);

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const formatTVL = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: selectedRange === 'all' || selectedRange === '2y' || selectedRange === '1y' ? 'numeric' : undefined
    });
  };

  if (bitcoinTVLLoading) {
    return <div className="p-6">Loading trading data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Bitcoin Trading Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <TimeRangeSelector 
            selectedRange={selectedRange} 
            onRangeChange={setSelectedRange} 
          />
          <ChartControls 
            chartHeight={chartHeight}
            onHeightChange={setChartHeight}
            showMACD={showMACD}
            onToggleMACD={setShowMACD}
            showStochastic={showStochastic}
            onToggleStochastic={setShowStochastic}
            showROC={showROC}
            onToggleROC={setShowROC}
            showTSM={showTSM}
            onToggleTSM={setShowTSM}
            showM2={showM2}
            onToggleM2={setShowM2}
          />
        </div>
      </div>

      {/* Bitcoin Price vs Volume Chart */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Bitcoin Price vs Volume</h2>
            <p className="text-sm text-muted-foreground">
              Correlation between Bitcoin price movements and trading volume. High volume often confirms price trends.
            </p>
          </div>
          <TimeRangeSelector 
            selectedRange={selectedRange} 
            onRangeChange={setSelectedRange} 
          />
        </div>
        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="price" orientation="left" tickFormatter={formatPrice} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="volume" orientation="right" tickFormatter={formatVolume} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Bitcoin Price') {
                    return [formatPrice(typeof value === 'number' ? value : 0), name];
                  } else if (name === 'Volume') {
                    return [formatVolume(typeof value === 'number' ? value : 0), name];
                  }
                  return [typeof value === 'number' ? value.toFixed(2) : 'N/A', name];
                }}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar yAxisId="volume" dataKey="volume" fill="hsl(var(--chart-2))" fillOpacity={0.3} name="Volume" />
              <Line yAxisId="price" type="monotone" dataKey="btcPrice" stroke="hsl(var(--primary))" strokeWidth={2} name="Bitcoin Price" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bitcoin Price vs TVL Chart */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Bitcoin Price vs Total Value Locked (TVL)</h2>
            <p className="text-sm text-muted-foreground">
              Comparison of Bitcoin price movements with the total value locked in Bitcoin DeFi protocols.
            </p>
            {btcTvlCorrelation !== null && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className={correlationInfo.color}>
                  Correlation: {btcTvlCorrelation.toFixed(3)} ({correlationInfo.strength})
                </Badge>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pearson correlation coefficient measuring linear relationship between BTC price and TVL</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          <TimeRangeSelector 
            selectedRange={selectedRange} 
            onRangeChange={setSelectedRange} 
          />
        </div>
        <div className="bg-chart-bg rounded-lg p-4" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="price" orientation="left" tickFormatter={formatPrice} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="tvl" orientation="right" tickFormatter={formatTVL} stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Bitcoin Price') {
                    return [formatPrice(typeof value === 'number' ? value : 0), name];
                  } else if (name === 'TVL') {
                    return [formatTVL(typeof value === 'number' ? value : 0), name];
                  }
                  return [typeof value === 'number' ? value.toFixed(2) : 'N/A', name];
                }}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Line yAxisId="price" type="monotone" dataKey="btcPrice" stroke="hsl(var(--primary))" strokeWidth={2} name="Bitcoin Price" dot={false} isAnimationActive={false} />
              <Line yAxisId="tvl" type="monotone" dataKey="tvl" stroke="hsl(var(--chart-3))" strokeWidth={2} name="TVL" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {showMACD && (
        <MACDChart 
          chartData={filteredChartData} 
          chartHeight={chartHeight} 
          formatDate={formatDate} 
        />
      )}

      {showStochastic && (
        <StochasticChart 
          chartData={filteredChartData} 
          chartHeight={chartHeight} 
          formatDate={formatDate} 
        />
      )}

      {showROC && (
        <ROCChart 
          chartData={filteredChartData} 
          chartHeight={chartHeight} 
          formatDate={formatDate} 
        />
      )}

      {showTSM && (
        <TimeSeriesMomentumChart 
          chartData={filteredChartData} 
          chartHeight={chartHeight} 
          formatDate={formatDate} 
        />
      )}

      {showM2 && (
        <IndependentM2Chart 
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          chartHeight={chartHeight}
        />
      )}
    </div>
  );
};

export default TradingDashboard;
