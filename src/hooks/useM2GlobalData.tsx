
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface M2DataPoint {
  date: string;
  m2Supply: number;
}

export const useM2GlobalData = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['m2-supply-data'],
    queryFn: async (): Promise<M2DataPoint[]> => {
      console.log('Fetching M2 supply data from Supabase database...');
      
      const { data, error } = await supabase
        .rpc('get_m2_supply_data') as { data: any[] | null, error: any };
      
      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('M2 supply data received from database:', { count: data?.length, sample: data?.[0] });
      
      // Process the data to match expected format
      const processedData = data?.map((item: any) => ({
        date: item.date,
        m2Supply: item.m2_supply
      })) || [];
      
      return processedData;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  console.log('Processed M2 supply data:', { count: rawData?.length, sample: rawData?.[0] });

  return {
    data: rawData || [],
    loading: isLoading,
    error
  };
};
