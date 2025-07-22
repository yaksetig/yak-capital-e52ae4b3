
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const isDev = Deno.env.get('NODE_ENV') === 'development';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (isDev) {
      console.log('Fetching Bitcoin TVL data from DefiLlama API...');
    }
    
    const response = await fetch('https://api.llama.fi/v2/historicalChainTvl/Bitcoin', {
      headers: {
        'Accept': '*/*'
      }
    });
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (isDev) {
      console.log(`Successfully fetched ${data.length} Bitcoin TVL data points`);
    }
    
    // Process the data to convert Unix timestamps to ISO dates and extract TVL
    const processedData = data.map((item: any) => ({
      date: new Date(item.date * 1000).toISOString().split('T')[0], // Convert Unix timestamp to YYYY-MM-DD
      tvl: item.tvl
    }));
    
    if (isDev) {
      console.log(`Returning ${processedData.length} processed Bitcoin TVL data points`);
    }
    
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
    console.error('Error fetching Bitcoin TVL data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch Bitcoin TVL data', 
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
