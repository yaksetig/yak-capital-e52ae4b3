import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, marketData } = await req.json();
    
    console.log(`Fetching AI recommendation for ${ticker}`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing recommendation within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: existingRecommendation, error: fetchError } = await supabase
      .from('ai_trade_recommendations')
      .select('*')
      .eq('ticker', ticker)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching existing recommendation:', fetchError);
      throw new Error('Failed to check existing recommendations');
    }

    // Return cached recommendation if exists
    if (existingRecommendation && existingRecommendation.length > 0) {
      console.log(`Returning cached AI recommendation for ${ticker}`);
      return new Response(JSON.stringify({ 
        data: existingRecommendation[0],
        fromCache: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate new recommendation using NVIDIA API
    console.log(`Generating new AI recommendation for ${ticker}`);
    
    const nvidiaApiKey = Deno.env.get('NVIDIA_API_KEY');
    if (!nvidiaApiKey) {
      throw new Error('NVIDIA API key not configured');
    }

    // Create comprehensive prompt with market data
    const prompt = `You are a professional cryptocurrency trading analyst. Based on the current market data for ${ticker}:

Current Price: $${marketData?.price || 'N/A'}
24h Change: ${marketData?.change || 'N/A'}%
RSI: ${marketData?.rsi || 'N/A'}
MACD Signal: ${marketData?.macd || 'N/A'}
Fear & Greed Index: ${marketData?.fearGreed || 'N/A'}
Market Cap Rank: ${marketData?.rank || 'N/A'}

Technical Analysis:
- Moving Average Status: ${marketData?.maStatus || 'N/A'}
- Volume Trend: ${marketData?.volume || 'N/A'}
- Support/Resistance Levels: ${marketData?.levels || 'Analyzing current levels'}

Provide a clear trading recommendation (BUY, HOLD, or SELL) with specific reasoning. Include:
1. Primary recommendation (BUY/HOLD/SELL)
2. Key supporting factors (2-3 bullet points)
3. Risk assessment
4. Confidence level (1-10)

Keep response concise but informative, under 250 words.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvidiaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'writer/palmyra-fin-70b-32k',
        messages: [
          { role: 'system', content: 'You are an expert cryptocurrency trading analyst providing actionable investment advice.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error('NVIDIA API error:', response.status, response.statusText);
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const recommendation = aiResponse.choices[0].message.content;
    
    // Extract recommendation type and confidence
    const recommendationType = recommendation.match(/\b(BUY|HOLD|SELL)\b/i)?.[0]?.toUpperCase() || 'HOLD';
    const confidenceMatch = recommendation.match(/confidence[:\s]*(\d+)/i);
    const confidenceScore = confidenceMatch ? parseInt(confidenceMatch[1]) : 7;

    // Store in database
    const { data: newRecommendation, error: insertError } = await supabase
      .from('ai_trade_recommendations')
      .insert({
        ticker,
        recommendation: recommendationType,
        reasoning: recommendation,
        confidence_score: confidenceScore,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing recommendation:', insertError);
      // Still return the recommendation even if storage fails
      return new Response(JSON.stringify({
        data: {
          ticker,
          recommendation: recommendationType,
          reasoning: recommendation,
          confidence_score: confidenceScore,
          created_at: new Date().toISOString(),
        },
        fromCache: false,
        storageError: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Generated and stored new AI recommendation for ${ticker}`);
    
    return new Response(JSON.stringify({ 
      data: newRecommendation,
      fromCache: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in fetch-ai-recommendation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate AI recommendation' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});