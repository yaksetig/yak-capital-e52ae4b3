
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface M2DataPoint {
  date: string;
  m2Supply: number;
}

interface M2ApiResponse {
  date: string;
  btcPrice: number;
  yoyGrowth: number;
  m2Supply: number;
}

export const useM2GlobalData = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['m2-global-data'],
    queryFn: async (): Promise<M2ApiResponse[]> => {
      console.log('Fetching M2 Global data via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-m2-data');
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      console.log('M2 Global data received:', { count: data.length, sample: data[0] });
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const processedData: M2DataPoint[] = rawData?.map(item => ({
    date: item.date,
    m2Supply: item.m2Supply
  })) || [];

  console.log('Processed M2 data:', { count: processedData.length, sample: processedData[0] });

  return {
    data: processedData,
    loading: isLoading,
    error
  };
};
