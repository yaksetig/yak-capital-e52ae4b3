
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface M2DataPoint {
  date: string;
  m2Supply: number;
}

export const useM2GlobalData = () => {
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ['m2-global-data'],
    queryFn: async (): Promise<M2DataPoint[]> => {
      console.log('Fetching M2 supply data from Supabase database...');
      
      // Using the REST API directly to call the function
      const response = await fetch(`https://envcoclhjitywvgwuywn.supabase.co/rest/v1/rpc/get_m2_supply_data`, {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudmNvY2xoaml0eXd2Z3d1eXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDUyODgsImV4cCI6MjA2ODYyMTI4OH0.rx3tvpZzmNfNbo6KJFbw1mqEHp0jbUOvc0lhdlPJEQs',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudmNvY2xoaml0eXd2Z3d1eXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDUyODgsImV4cCI6MjA2ODYyMTI4OH0.rx3tvpZzmNfNbo6KJFbw1mqEHp0jbUOvc0lhdlPJEQs`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch M2 data: ${response.statusText}`);
      }

      const data = await response.json();
      
      const processedData = data.map((item: any) => ({
        date: item.date,
        m2Supply: item.m2_supply
      }));
      
      console.log('M2 supply data received:', { count: processedData.length, sample: processedData[0] });
      return processedData;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  console.log('Processed M2 supply data:', { count: rawData?.length || 0, sample: rawData?.[0] });

  return {
    data: rawData || [],
    loading: isLoading,
    error
  };
};
