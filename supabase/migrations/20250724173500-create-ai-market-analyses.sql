CREATE TABLE public.ai_market_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_market_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to ai_market_analyses" ON public.ai_market_analyses
  FOR SELECT USING (true);

CREATE POLICY "Allow service role to manage ai_market_analyses" ON public.ai_market_analyses
  FOR ALL USING (auth.role() = 'service_role'::text);

CREATE INDEX idx_ai_market_analyses_ticker_created ON public.ai_market_analyses (ticker, created_at DESC);
