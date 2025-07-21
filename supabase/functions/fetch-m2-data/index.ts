
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching M2 Global data from bitcoincounterflow API...');
    
    const response = await fetch('https://api.bitcoincounterflow.com/api/m2-global');
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} M2 data points`);
    
    // Process the data to extract only what we need
    const processedData = data.map((item: any) => ({
      date: item.date,
      m2Supply: item.m2Supply,
      btcPrice: item.btcPrice,
      yoyGrowth: item.yoyGrowth
    }));
    
    console.log(`Returning ${processedData.length} processed M2 data points`);
    
    return new Response(
      JSON.stringify(processedData),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching M2 data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch M2 data', 
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
})
