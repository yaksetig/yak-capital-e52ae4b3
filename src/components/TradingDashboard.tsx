import React, { useState, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';
import ChartControls from './ChartControls';
import { useBitcoinTVLData } from '../hooks/useBitcoinTVLData';
import IndependentM2Chart from './IndependentM2Chart';
import { usePriceData } from '@/hooks/usePriceData';
import { format, parseISO } from 'date-fns';

interface PriceDataPoint {
  date: string;
  price: number;
}

interface TVLDataPoint {
  date: string;
  tvl: number;
}

interface CombinedDataPoint extends PriceDataPoint {
  tvl: number | null;
}

const formatDate = (date: string) => {
  return format(parseISO(date), 'MMM dd, yyyy');
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);
};

const formatPriceShort = (price: number) => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + 'M';
    } else if (price >= 1000) {
      return (price / 1000).toFixed(1) + 'K';
    } else {
      return price.toFixed(2);
    }
  };

const formatTVL = (tvl: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(tvl);
};

const formatM2Supply = (value: number) => {
  if (value >= 1000000000000) {
    return (value / 1000000000000).toFixed(1) + 'T';
  } else if (value >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else {
    return value.toFixed(0);
  }
};

const TradingDashboard = () => {
  const [timeRange, setTimeRange] = useState('1y');
  const [chartHeight, setChartHeight] = useState(500);
  const [yAxisDomain, setYAxisDomain] = useState(['auto', 'auto']);

  const { data: priceData, loading: priceLoading, error: priceError } = usePriceData();

  // Use Bitcoin TVL data for the original chart
  const { data: tvlData, loading: tvlLoading, error: tvlError } = useBitcoinTVLData();

  const combinedData = useMemo(() => {
    if (!priceData.length) return [];
    
    return priceData.map(pricePoint => {
      const tvlPoint = tvlData.find(tvl => {
        const priceDate = new Date(pricePoint.date).toDateString();
        const tvlDate = new Date(tvl.date).toDateString();
        return priceDate === tvlDate;
      });

      return {
        ...pricePoint,
        tvl: tvlPoint?.tvl || null
      };
    });
  }, [priceData, tvlData]);

  const filteredChartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1w':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '1m':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3m':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6m':
        startDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'ytd': {
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      }
      case 'all':
        return combinedData;
      default:
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const filteredData = combinedData.filter(dataPoint => {
      const dataDate = parseISO(dataPoint.date);
      return dataDate >= startDate;
    });

    return filteredData;
  }, [combinedData, timeRange]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2">Trading Dashboard</h1>
        <p className="text-muted-foreground">
          Visualize Bitcoin price, Total Value Locked (TVL), and Global Liquidity (M2 Supply) to make informed trading decisions.
        </p>
      </div>

      <div className="space-y-8">
        {/* Original Chart - Price vs TVL */}
        <Card className="p-6 shadow-card border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Price vs Total Value Locked (TVL)</h2>
              {tvlLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
            </div>
            <TimeRangeSelector 
              selectedRange={timeRange}
              onRangeChange={setTimeRange}
            />
          </div>
          
          {tvlError && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">Failed to load TVL data: {tvlError.message}</p>
            </div>
          )}
          
          <div className={`bg-chart-bg rounded-lg p-4`} style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  yAxisId="price"
                  orientation="left"
                  domain={yAxisDomain}
                  tickFormatter={formatPriceShort}
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
                
                {filteredChartData.some(d => d.tvl) && (
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
        <IndependentM2Chart
          filteredChartData={filteredChartData}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          chartHeight={chartHeight}
          formatDate={formatDate}
          formatPrice={formatPrice}
          formatPriceShort={formatPriceShort}
          formatM2Supply={formatM2Supply}
          yAxisDomain={yAxisDomain}
        />

        <ChartControls 
          yAxisPadding={10}
          onYAxisPaddingChange={() => {}}
          autoFit={true}
          onAutoFitChange={() => {}}
          onPriceRangeChange={() => {}}
          chartHeight={chartHeight}
          onChartHeightChange={setChartHeight}
          visibleLines={{}}
          onLineVisibilityChange={() => {}}
          showCycleAnalysis={false}
          onCycleAnalysisChange={() => {}}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onResetZoom={() => {}}
          onFocusRecent={() => {}}
        />
      </div>
    </div>
  );
};

export default TradingDashboard;
