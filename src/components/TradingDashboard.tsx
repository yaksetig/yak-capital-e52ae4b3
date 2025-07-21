import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import MACDChart from '@/components/MACDChart';
import StochasticChart from '@/components/StochasticChart';
import CycleAnalysisPanel from '@/components/CycleAnalysisPanel';
import NewsSection from '@/components/NewsSection';
import TimeSeriesMomentumChart from './TimeSeriesMomentumChart';

interface ChartData {
  date: string;
  price: number;
  volume: number;
}

const TradingDashboard = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<string>('30');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chartHeight = 300;

  const formatDate = useCallback((dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/data');
        setChartData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Price Chart Section */}
      <div className="p-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Trading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading data...</p>
            ) : (
              <p>Chart data loaded with {chartData.length} data points</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Indicator Charts */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Momentum Chart */}
        <TimeSeriesMomentumChart
          chartData={chartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        {/* MACD Chart */}
        <MACDChart
          chartData={chartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
        />

        {/* Stochastic Oscillator */}
        <StochasticChart
          chartData={chartData}
          chartHeight={chartHeight}
          formatDate={formatDate}
        />

        {/* Cycle Analysis Panel */}
        <CycleAnalysisPanel
          cycles={[]}
          cycleStrength={0}
          isVisible={true}
        />
      </div>

      {/* News Section */}
      <NewsSection symbol="BTC" />
    </div>
  );
};

export default TradingDashboard;
