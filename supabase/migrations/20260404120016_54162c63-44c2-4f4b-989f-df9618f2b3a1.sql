CREATE INDEX IF NOT EXISTS idx_backtests_user_id ON public.backtests (user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_strategy_id ON public.backtests (strategy_id);
CREATE INDEX IF NOT EXISTS idx_backtests_created_at ON public.backtests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtests_user_deleted ON public.backtests (user_id, is_deleted);