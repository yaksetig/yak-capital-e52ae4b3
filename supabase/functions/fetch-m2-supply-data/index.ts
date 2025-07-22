
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      console.log('Fetching M2 Supply and Bitcoin price data from Supabase database...');
    }
    
    // Create Supabase client using environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Call the updated database function to get M2 supply and Bitcoin price data
    const { data, error } = await supabase.rpc('get_m2_supply_data');
    
    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (isDev) {
      console.log(`Successfully fetched ${data?.length || 0} M2 supply and Bitcoin price data points`);
    }
    
    // Process the data to match expected format
    const processedData = data?.map((item: any) => ({
      date: new Date(item.date).toISOString().split('T')[0], // Convert to YYYY-MM-DD
      m2Supply: item.m2_supply,
      btcPrice: item.btc_price
    })) || [];
    
    if (isDev) {
      console.log(`Returning ${processedData.length} processed M2 supply and Bitcoin price data points`);
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
    console.error('Error fetching M2 supply and Bitcoin price data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch M2 supply and Bitcoin price data', 
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
