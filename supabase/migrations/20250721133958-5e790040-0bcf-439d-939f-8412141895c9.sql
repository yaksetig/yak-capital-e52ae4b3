
-- Create news_articles table
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  time_published TIMESTAMP WITH TIME ZONE NOT NULL,
  authors TEXT[],
  summary TEXT,
  source TEXT,
  category_within_source TEXT,
  source_domain TEXT,
  topics JSONB,
  overall_sentiment_score DECIMAL,
  overall_sentiment_label TEXT,
  ticker_sentiment JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_articles_ticker ON news_articles(ticker);
CREATE INDEX IF NOT EXISTS idx_news_articles_time_published ON news_articles(time_published DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_ticker_time ON news_articles(ticker, time_published DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading for authenticated and anonymous users
CREATE POLICY "Allow read access to news_articles" ON news_articles
  FOR SELECT USING (true);

-- Create policy to allow insert/update for service role (Edge Functions)
CREATE POLICY "Allow service role to manage news_articles" ON news_articles
  FOR ALL USING (auth.role() = 'service_role');
