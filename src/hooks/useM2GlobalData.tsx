
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface M2DataPoint {
  date: string;
  m2Supply: number;
}

interface M2ApiResponse {
  date: string;
  m2_supply: number;
}

export const useM2GlobalData = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['m2-global-data'],
    queryFn: async (): Promise<M2ApiResponse[]> => {
      console.log('Fetching M2 supply data from Supabase database...');
      
      const { data, error } = await (supabase as any).rpc('get_m2_supply_data');
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from database');
      }
      
      console.log('M2 supply data received:', { count: (data as any[]).length, sample: data[0] });
      return data as M2ApiResponse[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const processedData: M2DataPoint[] = rawData?.map(item => ({
    date: item.date,
    m2Supply: item.m2_supply
  })) || [];

  console.log('Processed M2 supply data:', { count: processedData.length, sample: processedData[0] });

  return {
    data: processedData,
    loading: isLoading,
    error
  };
};
