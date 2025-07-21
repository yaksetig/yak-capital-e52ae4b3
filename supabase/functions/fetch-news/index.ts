import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check for cached news (within last 6 hours)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    
    const { data: cachedNews, error: cacheError } = await supabase
      .from('news_articles')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .gte('created_at', sixHoursAgo)
      .order('time_published', { ascending: false })
      .limit(50)

    if (cacheError) {
      console.error('Cache query error:', cacheError)
    }

    // If we have recent cached news, return it
    if (cachedNews && cachedNews.length > 0) {
      console.log(`Returning ${cachedNews.length} cached articles for ${ticker}`)
      return new Response(
        JSON.stringify(cachedNews),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Otherwise, fetch fresh data from Alpha Vantage
    console.log(`Fetching fresh news for ${ticker} from Alpha Vantage`)
    
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured')
    }

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
    console.log('Alpha Vantage API response:', JSON.stringify(data, null, 2))
    
    if (!data.feed || !Array.isArray(data.feed)) {
      console.error('Invalid Alpha Vantage response structure:', {
        hasFeeds: !!data.feed,
        feedType: typeof data.feed,
        keys: Object.keys(data),
        limitReached: data.Information
      })
      
      // Check if it's a rate limit or API limit response
      if (data.Information && data.Information.includes('call frequency')) {
        throw new Error('Alpha Vantage API rate limit exceeded. Please try again later.')
      }
      
      // Try alternative ticker formats for crypto
      if (ticker.toUpperCase() === 'BTC') {
        console.log('Trying alternative ticker format for BTC...')
        const altUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=BTC&time_from=${timeFrom}&limit=50&sort=RELEVANCE&apikey=${ALPHA_VANTAGE_API_KEY}`
        
        try {
          const altResponse = await fetch(altUrl)
          const altData = await altResponse.json()
          console.log('Alternative ticker response:', JSON.stringify(altData, null, 2))
          
          if (altData.feed && Array.isArray(altData.feed)) {
            data.feed = altData.feed
          }
        } catch (altError) {
          console.error('Alternative ticker request failed:', altError)
        }
      }
      
      // If still no valid feed, throw error with more details
      if (!data.feed || !Array.isArray(data.feed)) {
        throw new Error(`Invalid news data format from Alpha Vantage. Response: ${JSON.stringify(data)}`)
      }
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
      return new Response(
        JSON.stringify(data.feed),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Cached ${insertedNews?.length || 0} articles for ${ticker}`)
    
    return new Response(
      JSON.stringify(insertedNews || data.feed),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-news function:', error)
    
    // If API fails, try to return any cached data we have (even if older than 6 hours)
    try {
      const { data: fallbackNews, error: fallbackError } = await supabase
        .from('news_articles')
        .select('*')
        .eq('ticker', ticker.toUpperCase())
        .order('time_published', { ascending: false })
        .limit(50)

      if (!fallbackError && fallbackNews && fallbackNews.length > 0) {
        console.log(`Returning ${fallbackNews.length} fallback cached articles for ${ticker}`)
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
