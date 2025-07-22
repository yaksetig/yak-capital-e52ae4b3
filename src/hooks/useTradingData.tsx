
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CandleData, TechnicalIndicators, ProcessedChartData } from '@/types/trading';
import { calculateAllIndicators } from '@/utils/technicalIndicators';
import { processChartData, filterDataByTimeRange } from '@/utils/chartUtils';

interface TradingDataState {
  rawData: CandleData[];
  chartData: ProcessedChartData[];
  indicators: TechnicalIndicators;
  loading: boolean;
  error: string | null;
}

export const useTradingData = (symbol: string, interval: string, timeRange: string) => {
  const [state, setState] = useState<TradingDataState>({
    rawData: [],
    chartData: [],
    indicators: {
      rsi: null,
      macd: { macd: null, signal: null, histogram: null },
      stochastic: { k: null, d: null },
      sma20: null,
      sma50: null,
      ema12: null,
      ema26: null,
    },
    loading: true,
    error: null,
  });

  // Fetch raw price data
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['bitcoin-data', symbol, interval],
    queryFn: async () => {
      console.log(`Fetching ${symbol} data via Edge Function...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-bitcoin-data', {
        body: { symbol, interval }
      });
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      console.log(`${symbol} data received:`, { count: data.length, sample: data[0] });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Process data when apiData, timeRange, or interval changes
  useEffect(() => {
    if (isLoading) {
      setState(prev => ({ ...prev, loading: true, error: null }));
      return;
    }

    if (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to fetch data' 
      }));
      return;
    }

    if (!apiData || apiData.length === 0) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'No data available' 
      }));
      return;
    }

    try {
      // Filter data by time range
      const filteredData = filterDataByTimeRange(apiData, timeRange);
      
      // Calculate indicators
      const indicators = calculateAllIndicators(filteredData);
      
      // Process chart data
      const chartData = processChartData(filteredData);
      
      setState({
        rawData: filteredData,
        chartData,
        indicators,
        loading: false,
        error: null,
      });
      
      console.log('Data processed successfully:', {
        rawDataCount: filteredData.length,
        chartDataCount: chartData.length,
        indicators
      });
      
    } catch (processingError) {
      console.error('Error processing data:', processingError);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to process data' 
      }));
    }
  }, [apiData, isLoading, error, timeRange, interval]);

  return state;
};
