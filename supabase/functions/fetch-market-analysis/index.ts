import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const isDev = Deno.env.get('NODE_ENV') === 'development';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, indicators } = await req.json();

    if (isDev) {
      console.log(`Fetching AI market analysis for ${ticker}`);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: existing, error: fetchError } = await supabase
      .from('ai_market_analyses')
      .select('*')
      .eq('ticker', ticker)
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing analysis:', fetchError);
      throw new Error('Failed to check existing analyses');
    }

    if (existing && existing.length > 0) {
      if (isDev) {
        console.log(`Returning cached AI market analysis for ${ticker}`);
      }
      return new Response(JSON.stringify({ data: existing[0], fromCache: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nvidiaApiKey = Deno.env.get('NVIDIA_API_KEY');
    if (!nvidiaApiKey) {
      throw new Error('NVIDIA API key not configured');
    }

    const prompt = `Provide a concise summary of the current ${ticker} market based on these indicators:\n` +
      `${JSON.stringify(indicators, null, 2)}\n` +
      `Keep it under 200 words.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'writer/palmyra-fin-70b-32k',
        messages: [
          { role: 'system', content: 'You are an expert cryptocurrency market analyst.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      console.error('NVIDIA API error:', response.status, response.statusText);
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;

    const { data: newAnalysis, error: insertError } = await supabase
      .from('ai_market_analyses')
      .insert({ ticker, analysis: analysisText })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing analysis:', insertError);
      return new Response(JSON.stringify({
        data: { ticker, analysis: analysisText, created_at: new Date().toISOString() },
        fromCache: false,
        storageError: true,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (isDev) {
      console.log(`Generated and stored new AI market analysis for ${ticker}`);
    }

    return new Response(JSON.stringify({ data: newAnalysis, fromCache: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-market-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate AI market analysis' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
