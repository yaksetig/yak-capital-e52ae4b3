-- Create ai_market_analyses table
CREATE TABLE public.ai_market_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_market_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (market analysis is public information)
CREATE POLICY "Market analyses are publicly readable" 
ON public.ai_market_analyses 
FOR SELECT 
USING (true);

-- Create index for better performance on ticker lookups
CREATE INDEX idx_ai_market_analyses_ticker ON public.ai_market_analyses(ticker);
CREATE INDEX idx_ai_market_analyses_created_at ON public.ai_market_analyses(created_at DESC);