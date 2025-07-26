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
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol') || 'BTCUSDT';
    const interval = url.searchParams.get('interval') || '1d';
    const limit = url.searchParams.get('limit') || '365';
    
    if (isDev) {
      console.log(`Fetching Binance data for ${symbol} with interval ${interval} and limit ${limit}...`);
    }
    
    // Fetch klines data
    const klinesResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        headers: {
          'Accept': '*/*'
        }
      }
    );
    
    if (!klinesResponse.ok) {
      console.error(`Klines API request failed with status: ${klinesResponse.status}`);
      throw new Error(`HTTP error! status: ${klinesResponse.status}`);
    }
    
    const klinesData = await klinesResponse.json();
    
    // Fetch 24hr ticker data
    const tickerResponse = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      {
        headers: {
          'Accept': '*/*'
        }
      }
    );
    
    if (!tickerResponse.ok) {
      console.error(`Ticker API request failed with status: ${tickerResponse.status}`);
      throw new Error(`HTTP error! status: ${tickerResponse.status}`);
    }
    
    const tickerData = await tickerResponse.json();
    
    if (isDev) {
      console.log(`Successfully fetched ${klinesData.length} klines data points and ticker data`);
    }
    
    return new Response(
      JSON.stringify({
        klines: klinesData,
        ticker: tickerData
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch Binance data', 
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