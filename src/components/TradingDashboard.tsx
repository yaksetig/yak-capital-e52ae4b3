import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import TimeRangeSelector from './TimeRangeSelector';
import { useM2GlobalData } from '../hooks/useM2GlobalData';
import { useBitcoinTVLData } from '../hooks/useBitcoinTVLData';
import { calculateCorrelation, getCorrelationInfo } from '../utils/correlation';

const TradingDashboard = () => {
  const [timeRange, setTimeRange] = useState('365');
  const { data: m2Data, loading: m2Loading } = useM2GlobalData();
  const { data: tvlData, loading: tvlLoading } = useBitcoinTVLData();

  const combinedData = useMemo(() => {
    if (!m2Data || !tvlData) return [];
  
    return m2Data.map(m2Entry => {
      const tvlEntry = tvlData.find(tvl => tvl.date === m2Entry.date);
      return {
        date: m2Entry.date,
        m2Supply: m2Entry.m2Supply,
        btcPrice: m2Entry.btcPrice,
        tvl: tvlEntry ? tvlEntry.tvl : null,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [m2Data, tvlData]);

  const filteredChartData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - parseInt(timeRange)));

    return combinedData.filter(item => new Date(item.date) >= cutoff);
  }, [combinedData, timeRange]);

  // Calculate correlation between Bitcoin price and TVL
  const tvlCorrelation = useMemo(() => {
    if (filteredChartData.length < 2) return null;
    
    const priceValues = filteredChartData.map(item => item.btcPrice).filter(val => val !== null && val !== undefined && !isNaN(val));
    const tvlValues = filteredChartData.map(item => item.tvl).filter(val => val !== null && val !== undefined && !isNaN(val));
    
    // Only calculate if we have matching data points
    const validPairs = filteredChartData
      .filter(item => item.btcPrice !== null && item.tvl !== null && 
                     !isNaN(item.btcPrice) && !isNaN(item.tvl))
      .map(item => ({ price: item.btcPrice, tvl: item.tvl }));
    
    if (validPairs.length < 2) return null;
    
    const prices = validPairs.map(pair => pair.price);
    const tvls = validPairs.map(pair => pair.tvl);
    
    return calculateCorrelation(prices, tvls);
  }, [filteredChartData]);

  const tvlCorrelationInfo = getCorrelationInfo(tvlCorrelation);

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  const formatTVL = (value: number) => `$${(value / 1e9).toFixed(2)}B`;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8">
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-foreground">M2 Money Supply vs Bitcoin Price</h2>
          {(m2Loading || tvlLoading) && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
        </div>
        <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filteredChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={formatDate} className="text-xs text-muted-foreground" />
            <YAxis yAxisId="left" tickFormatter={(value) => `$${value / 1000}K`} className="text-xs text-muted-foreground" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={formatPrice} className="text-xs text-muted-foreground" />
            <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="m2Supply" stroke="#8884d8" name="M2 Money Supply (K)" />
            <Line yAxisId="right" type="monotone" dataKey="btcPrice" stroke="#82ca9d" name="Bitcoin Price" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Price vs TVL Chart */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Bitcoin Price vs Total Value Locked (TVL)</h2>
            <div className="mt-2 p-2 bg-muted/50 rounded-lg">
              <div className="text-sm">
                <span className="text-muted-foreground">Correlation: </span>
                <span className={`font-semibold ${tvlCorrelationInfo.color}`}>
                  {tvlCorrelation !== null ? tvlCorrelation.toFixed(3) : 'N/A'}
                </span>
                <span className={`ml-2 text-sm ${tvlCorrelationInfo.color}`}>
                  ({tvlCorrelationInfo.strength})
                </span>
              </div>
            </div>
          </div>
          {(m2Loading || tvlLoading) && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
        </div>
        
        <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filteredChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickFormatter={formatDate} className="text-xs text-muted-foreground" />
            <YAxis yAxisId="left" tickFormatter={formatTVL} className="text-xs text-muted-foreground" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={formatPrice} className="text-xs text-muted-foreground" />
            <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="tvl" stroke="#8884d8" name="Total Value Locked (TVL)" />
            <Line yAxisId="right" type="monotone" dataKey="btcPrice" stroke="#82ca9d" name="Bitcoin Price" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 shadow-card border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Combined Data Table</h2>
        <TimeRangeSelector selectedRange={timeRange} onRangeChange={setTimeRange} />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  M2 Supply
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Bitcoin Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  TVL
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredChartData.map((item) => (
                <tr key={item.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.m2Supply}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.btcPrice}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{item.tvl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TradingDashboard;
