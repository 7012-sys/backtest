
-- Drop and recreate market_data_cache with per-candle storage
DROP TABLE IF EXISTS public.market_data_cache;

CREATE TABLE public.market_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  timeframe text NOT NULL,
  timestamp timestamptz NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(symbol, timeframe, timestamp)
);

-- Index for fast lookups
CREATE INDEX idx_market_data_cache_lookup ON public.market_data_cache (symbol, timeframe, timestamp);

-- Enable RLS
ALTER TABLE public.market_data_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read (market data is public)
CREATE POLICY "Anyone can read market data cache" ON public.market_data_cache FOR SELECT USING (true);

-- Only service role can insert (via edge function)
CREATE POLICY "Service role can insert market data" ON public.market_data_cache FOR INSERT WITH CHECK (true);

-- Create AI strategy cache table
CREATE TABLE public.ai_strategy_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text NOT NULL UNIQUE,
  prompt text NOT NULL,
  strategy_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  usage_count integer NOT NULL DEFAULT 1
);

CREATE INDEX idx_ai_strategy_cache_hash ON public.ai_strategy_cache (prompt_hash);

ALTER TABLE public.ai_strategy_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached strategies
CREATE POLICY "Anyone can read strategy cache" ON public.ai_strategy_cache FOR SELECT USING (true);

-- Service role inserts via edge function
CREATE POLICY "Service role can insert strategy cache" ON public.ai_strategy_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update strategy cache" ON public.ai_strategy_cache FOR UPDATE USING (true);

-- Create AI usage tracking table
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai usage" ON public.ai_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai usage" ON public.ai_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai usage" ON public.ai_usage FOR UPDATE USING (auth.uid() = user_id);
