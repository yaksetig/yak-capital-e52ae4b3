
-- Create table for AI trade recommendations
CREATE TABLE public.ai_trade_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  reasoning TEXT,
  confidence_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.ai_trade_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (similar to news_articles)
CREATE POLICY "Allow read access to ai_trade_recommendations" 
  ON public.ai_trade_recommendations 
  FOR SELECT 
  USING (true);

-- Create policy for service role to manage recommendations
CREATE POLICY "Allow service role to manage ai_trade_recommendations" 
  ON public.ai_trade_recommendations 
  FOR ALL 
  USING (auth.role() = 'service_role'::text);

-- Create index for efficient ticker-based queries
CREATE INDEX idx_ai_trade_recommendations_ticker_created 
  ON public.ai_trade_recommendations (ticker, created_at DESC);
