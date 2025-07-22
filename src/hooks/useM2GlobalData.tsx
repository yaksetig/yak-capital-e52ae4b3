
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface M2DataPoint {
  date: string;
  m2Supply: number;
}

interface M2DatabaseRow {
  date: string;
  m2_supply: number;
}

export const useM2GlobalData = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['m2-global-data'],
    queryFn: async (): Promise<M2DatabaseRow[]> => {
      console.log('Fetching M2 supply data using database function...');
      
      const { data, error } = await (supabase as any).rpc('get_m2_supply_data');
      
      if (error) {
        console.error('Database function error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data) {
        console.log('No M2 supply data received');
        return [];
      }
      
      console.log('M2 supply data received:', { count: data.length, sample: data[0] });
      return data as M2DatabaseRow[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const processedData: M2DataPoint[] = rawData?.map(item => ({
    date: new Date(item.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
    m2Supply: item.m2_supply // Map the database column to our interface
  })) || [];

  console.log('Processed M2 supply data:', { count: processedData.length, sample: processedData[0] });

  return {
    data: processedData,
    loading: isLoading,
    error
  };
};
