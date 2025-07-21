
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

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
      const response = await fetch('https://api.bitcoincounterflow.com/api/m2-global');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const processedData: M2DataPoint[] = rawData?.map(item => ({
    date: item.date,
    m2Supply: item.m2Supply
  })) || [];

  return {
    data: processedData,
    loading: isLoading,
    error
  };
};
