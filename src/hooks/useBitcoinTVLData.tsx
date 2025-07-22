
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TVLDataPoint {
  date: string;
  tvl: number;
}

interface TVLApiResponse {
  date: string;
  tvl: number;
}

export const useBitcoinTVLData = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['bitcoin-tvl-data'],
    queryFn: async (): Promise<TVLApiResponse[]> => {
      console.log('Fetching Bitcoin TVL data via Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-bitcoin-tvl-data');
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      console.log('Bitcoin TVL data received:', { count: data.length, sample: data[0] });
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  const processedData: TVLDataPoint[] = rawData?.map(item => ({
    date: item.date,
    tvl: item.tvl
  })) || [];

  console.log('Processed Bitcoin TVL data:', { count: processedData.length, sample: processedData[0] });

  return {
    data: processedData,
    loading: isLoading,
    error
  };
};
