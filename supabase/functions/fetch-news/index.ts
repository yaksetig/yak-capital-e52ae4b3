
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const isDev = Deno.env.get('NODE_ENV') === 'development';

interface NewsArticle {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
  overall_sentiment_score: string;
  overall_sentiment_label: string;
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
}

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<any>>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticker } = await req.json()
    
    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tickerKey = ticker.toUpperCase();

    // Check if there's already an ongoing request for this ticker
    if (ongoingRequests.has(tickerKey)) {
      if (isDev) {
        console.log(`Waiting for ongoing request for ${tickerKey}`);
      }
      const result = await ongoingRequests.get(tickerKey);
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client outside try block for availability in catch
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check for cached news (within last 24 hours instead of 6 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: cachedNews, error: cacheError } = await supabase
      .from('news_articles')
      .select('*')
      .eq('ticker', tickerKey)
      .gte('created_at', twentyFourHoursAgo)
      .order('time_published', { ascending: false })
      .limit(50)

    if (cacheError) {
      console.error('Cache query error:', cacheError)
    }

    // If we have recent cached news, return it
    if (cachedNews && cachedNews.length > 0) {
      if (isDev) {
        console.log(`Returning ${cachedNews.length} cached articles for ${tickerKey}`)
      }
      return new Response(
        JSON.stringify(cachedNews),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a promise for the API request to prevent duplicates
    const requestPromise = fetchFreshNews(tickerKey, supabase);
    ongoingRequests.set(tickerKey, requestPromise);

    try {
      const result = await requestPromise;
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } finally {
      // Clean up the ongoing request
      ongoingRequests.delete(tickerKey);
    }

  } catch (error) {
    console.error('Error in fetch-news function:', error)
    
    // If API fails, try to return any cached data we have (even if older than 24 hours)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { ticker } = await req.json().catch(() => ({ ticker: 'BTC' }));
      const tickerKey = ticker.toUpperCase();

      const { data: fallbackNews, error: fallbackError } = await supabase
        .from('news_articles')
        .select('*')
        .eq('ticker', tickerKey)
        .order('time_published', { ascending: false })
        .limit(50)

      if (!fallbackError && fallbackNews && fallbackNews.length > 0) {
        if (isDev) {
          console.log(`Returning ${fallbackNews.length} fallback cached articles for ${tickerKey}`)
        }
        return new Response(
          JSON.stringify(fallbackNews),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } catch (fallbackErr) {
      console.error('Fallback cache query also failed:', fallbackErr)
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch news', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function fetchFreshNews(ticker: string, supabase: any) {
  if (isDev) {
    console.log(`Fetching fresh news for ${ticker} from Alpha Vantage`)
  }
  
  const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
  if (!ALPHA_VANTAGE_API_KEY) {
    throw new Error('ALPHA_VANTAGE_API_KEY not configured')
  }

  // Always use CRYPTO: prefix for consistency
  const cryptoTicker = `CRYPTO:${ticker.toUpperCase()}`
  const timeFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '') + 'T0000'
  
  const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${cryptoTicker}&time_from=${timeFrom}&limit=50&sort=RELEVANCE&apikey=${ALPHA_VANTAGE_API_KEY}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  
  // Log the actual response for debugging
  if (isDev) {
    console.log('Alpha Vantage API response:', JSON.stringify(data, null, 2))
  }
  
  // Check if it's a rate limit response - if so, try to return cached data instead
  if (data.Information && data.Information.includes('call frequency')) {
    if (isDev) {
      console.log('Alpha Vantage API rate limit exceeded - checking for any cached data')
    }
    
    // Try to get any cached data regardless of age
    const { data: anyCachedNews, error: anyError } = await supabase
      .from('news_articles')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .order('time_published', { ascending: false })
      .limit(50)

    if (!anyError && anyCachedNews && anyCachedNews.length > 0) {
      if (isDev) {
        console.log(`Returning ${anyCachedNews.length} old cached articles due to rate limit for ${ticker}`)
      }
      return anyCachedNews;
    }
    
    throw new Error('Alpha Vantage API rate limit exceeded. Please try again later.')
  }
  
  if (!data.feed || !Array.isArray(data.feed)) {
    console.error('Invalid Alpha Vantage response structure:', {
      hasFeeds: !!data.feed,
      feedType: typeof data.feed,
      keys: Object.keys(data),
      response: data
    })
    
    throw new Error(`Invalid news data format from Alpha Vantage. Response: ${JSON.stringify(data)}`)
  }

  // Store news articles in database
  const articlesToInsert = data.feed.map((article: NewsArticle) => ({
    ticker: ticker.toUpperCase(),
    title: article.title,
    url: article.url,
    time_published: parseAlphaVantageDate(article.time_published),
    authors: article.authors || [],
    summary: article.summary,
    source: article.source,
    category_within_source: article.category_within_source,
    source_domain: article.source_domain,
    topics: article.topics || [],
    overall_sentiment_score: parseFloat(article.overall_sentiment_score) || null,
    overall_sentiment_label: article.overall_sentiment_label,
    ticker_sentiment: article.ticker_sentiment || []
  }))

  // Insert articles (ignore duplicates based on URL)
  const { data: insertedNews, error: insertError } = await supabase
    .from('news_articles')
    .upsert(articlesToInsert, { 
      onConflict: 'url',
      ignoreDuplicates: false 
    })
    .select()

  if (insertError) {
    console.error('Insert error:', insertError)
    // Still return the fresh data even if caching failed
    return data.feed
  }

  if (isDev) {
    console.log(`Cached ${insertedNews?.length || 0} articles for ${ticker}`)
  }
  
  return insertedNews || data.feed
}

function parseAlphaVantageDate(dateString: string): string {
  try {
    // Alpha Vantage format: YYYYMMDDTHHMMSS (e.g., "20240720T123000")
    if (dateString.includes('T') && dateString.length === 15) {
      const year = dateString.substring(0, 4)
      const month = dateString.substring(4, 6)
      const day = dateString.substring(6, 8)
      const hour = dateString.substring(9, 11)
      const minute = dateString.substring(11, 13)
      const second = dateString.substring(13, 15)
      
      // Create ISO format: YYYY-MM-DDTHH:mm:ssZ
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
    }
    
    // Fallback - try to parse as-is
    return new Date(dateString).toISOString()
  } catch {
    // Last resort - use current time
    return new Date().toISOString()
  }
}
