import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card"
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { useM2GlobalData } from '@/hooks/useM2GlobalData';
import { format, parseISO } from 'date-fns';
import TimeRangeSelector from './TimeRangeSelector';
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, formatPriceShort } from '@/lib/utils';

// Define a type for the chart data
interface ChartData {
  date: string;
  price: number;
  m2Supply: number;
}

// Function to format the date for the chart
const formatDate = (date: string) => {
  return format(parseISO(date), 'MMM dd, yyyy');
};

// Function to format M2 supply
const formatM2Supply = (value: number) => {
  if (value >= 1_000_000_000_000) {
    return (value / 1_000_000_000_000).toFixed(2) + 'T';
  }
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
};

const TradingDashboard = () => {
  // State for time range selection
  const [timeRange, setTimeRange] = useState('1y'); // Default time range

  // Fetch Bitcoin price data
  const { data: bitcoinPriceData, loading: priceLoading, error: priceError } = useBitcoinPrice();

  // Fetch M2 global data
  const { data: m2Data, loading: m2Loading, error: m2Error } = useM2GlobalData();

  // State for chart height
  const [chartHeight, setChartHeight] = useState(400);

  // Update chart height on window resize
  useEffect(() => {
    const handleResize = () => {
      // You can adjust the height calculation based on your needs
      setChartHeight(window.innerWidth < 640 ? 300 : 400);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial calculation

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to filter data based on the selected time range
  const filterDataByTimeRange = useCallback((data: ChartData[], range: string) => {
    if (!data || data.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate: Date;

    switch (range) {
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
      case 'all':
        return data; // Show all data
      default:
        return data; // Default to showing all data
    }

    return data.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= startDate;
    });
  }, []);

  // Combine and process data for the chart
  const chartData: ChartData[] = React.useMemo(() => {
    if (!bitcoinPriceData || !m2Data) return [];

    // Convert both datasets to a common format and ensure they are sorted
    const priceData = bitcoinPriceData.map(item => ({
      date: item.date,
      price: item.price,
    }));

    const m2SupplyData = m2Data.map(item => ({
      date: item.date,
      m2Supply: item.m2Supply,
    }));

    // Merge the datasets based on the date
    const combinedData: ChartData[] = [];
    let i = 0, j = 0;

    while (i < priceData.length && j < m2SupplyData.length) {
      if (priceData[i].date === m2SupplyData[j].date) {
        combinedData.push({
          date: priceData[i].date,
          price: priceData[i].price,
          m2Supply: m2SupplyData[j].m2Supply,
        });
        i++;
        j++;
      } else if (priceData[i].date < m2SupplyData[j].date) {
        combinedData.push({
          date: priceData[i].date,
          price: priceData[i].price,
          m2Supply: null,
        });
        i++;
      } else {
        combinedData.push({
          date: m2SupplyData[j].date,
          price: null,
          m2Supply: m2SupplyData[j].m2Supply,
        });
        j++;
      }
    }

    // Add any remaining price data
    while (i < priceData.length) {
      combinedData.push({
        date: priceData[i].date,
        price: priceData[i].price,
        m2Supply: null,
      });
      i++;
    }

    // Add any remaining M2 supply data
    while (j < m2SupplyData.length) {
      combinedData.push({
        date: m2SupplyData[j].date,
        price: null,
        m2Supply: m2SupplyData[j].m2Supply,
      });
      j++;
    }

    return combinedData;
  }, [bitcoinPriceData, m2Data]);

  // Filter chart data based on the selected time range
  const filteredChartData = React.useMemo(() => {
    return filterDataByTimeRange(chartData, timeRange);
  }, [chartData, timeRange, filterDataByTimeRange]);

  // Determine the Y-axis domain based on the filtered data
  const yAxisDomain = React.useMemo(() => {
    if (!filteredChartData || filteredChartData.length === 0) {
      return [0, 'auto'];
    }

    const prices = filteredChartData.map(item => item.price).filter(price => typeof price === 'number') as number[];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Add some padding to the domain
    const padding = (maxPrice - minPrice) * 0.05; // 5% padding
    return [minPrice - padding, maxPrice + padding];
  }, [filteredChartData]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Bitcoin Price vs. M2 Money Supply</h1>
        <p className="text-muted-foreground">Visualizing the relationship between Bitcoin price and global liquidity.</p>
      </header>

      {/* Price vs Global Liquidity (M2) Chart - Replica */}
      <Card className="p-6 mb-8 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Price vs Global Liquidity (M2)</h2>
            {m2Loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          </div>
          <TimeRangeSelector 
            selectedRange={timeRange}
            onRangeChange={setTimeRange}
          />
        </div>
        
        {m2Error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">Failed to load M2 data: {m2Error.message}</p>
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
                domain={yAxisDomain as [number, number]}
                tickFormatter={formatPriceShort}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                yAxisId="m2"
                orientation="right"
                tickFormatter={formatM2Supply}
                stroke="hsl(var(--chart-2))"
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Price') return [formatPrice(Number(value)), name];
                  if (name === 'M2 Supply') return [formatM2Supply(Number(value)), name];
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
              
              {filteredChartData.some(d => d.m2Supply) && (
                <Line 
                  yAxisId="m2"
                  type="monotone" 
                  dataKey="m2Supply" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2} 
                  name="M2 Supply" 
                  dot={false} 
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Additional charts or indicators can be added here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 shadow-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Bitcoin Price</h3>
          {priceLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : priceError ? (
            <p className="text-sm text-destructive">Failed to load price data.</p>
          ) : (
            <p className="text-2xl font-bold text-primary">{bitcoinPriceData && bitcoinPriceData.length > 0 ? formatPrice(bitcoinPriceData[bitcoinPriceData.length - 1].price) : 'N/A'}</p>
          )}
        </Card>

        <Card className="p-4 shadow-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">M2 Money Supply</h3>
          {m2Loading ? (
            <Skeleton className="h-6 w-full" />
          ) : m2Error ? (
            <p className="text-sm text-destructive">Failed to load M2 data.</p>
          ) : (
            <p className="text-2xl font-bold text-primary">{m2Data && m2Data.length > 0 ? formatM2Supply(m2Data[m2Data.length - 1].m2Supply) : 'N/A'}</p>
          )}
        </Card>

        {/* Add more indicator cards as needed */}
      </div>
    </div>
  );
};

export default TradingDashboard;
