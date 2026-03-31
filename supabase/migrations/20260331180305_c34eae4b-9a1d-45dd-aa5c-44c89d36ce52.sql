-- Fix overly permissive RLS policies on ai_strategy_cache
DROP POLICY IF EXISTS "Service role can insert strategy cache" ON public.ai_strategy_cache;
DROP POLICY IF EXISTS "Service role can update strategy cache" ON public.ai_strategy_cache;

CREATE POLICY "Service role can insert strategy cache"
ON public.ai_strategy_cache
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update strategy cache"
ON public.ai_strategy_cache
FOR UPDATE
TO service_role
USING (true);

-- Fix overly permissive RLS policies on market_data_cache
DROP POLICY IF EXISTS "Service role can insert market data" ON public.market_data_cache;

CREATE POLICY "Service role can insert market data"
ON public.market_data_cache
FOR INSERT
TO service_role
WITH CHECK (true);