
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface M2AndBitcoinDataPoint {
  date: string;
  m2Supply: number;
  btcPrice: number;
}

interface M2AndBitcoinApiResponse {
  date: string;
  m2Supply: number;
  btcPrice: number;
}

export const useM2GlobalData = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['m2-global-data'],
    queryFn: async (): Promise<M2AndBitcoinApiResponse[]> => {
      console.log('Fetching M2 Supply and Bitcoin price data via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-m2-supply-data');
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      console.log('M2 Supply and Bitcoin price data received:', { count: data.length, sample: data[0] });
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const processedData: M2AndBitcoinDataPoint[] = rawData?.map(item => ({
    date: item.date,
    m2Supply: item.m2Supply,
    btcPrice: item.btcPrice
  })) || [];

  console.log('Processed M2 Supply and Bitcoin price data:', { count: processedData.length, sample: processedData[0] });

  return {
    data: processedData,
    loading: isLoading,
    error
  };
};
