
-- Community Strategies table
CREATE TABLE public.community_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  dataset_used TEXT NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  performance_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  equity_curve JSONB NOT NULL DEFAULT '[]'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_strategies ENABLE ROW LEVEL SECURITY;

-- Everyone can read public strategies
CREATE POLICY "Anyone can view public strategies"
ON public.community_strategies FOR SELECT
USING (visibility = 'public');

-- Users can insert their own
CREATE POLICY "Users can insert own community strategies"
ON public.community_strategies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "Users can delete own community strategies"
ON public.community_strategies FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Backtest Runs table (for advanced insights)
CREATE TABLE public.backtest_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  strategy_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  dataset TEXT NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  trades JSONB NOT NULL DEFAULT '[]'::jsonb,
  equity_curve JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.backtest_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backtest runs"
ON public.backtest_runs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backtest runs"
ON public.backtest_runs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backtest runs"
ON public.backtest_runs FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Index for community page performance
CREATE INDEX idx_community_strategies_visibility ON public.community_strategies(visibility, created_at DESC);
CREATE INDEX idx_backtest_runs_user ON public.backtest_runs(user_id, created_at DESC);
