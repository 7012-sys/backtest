-- Fix 1: Restrict ai_strategy_cache SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can read strategy cache" ON public.ai_strategy_cache;
CREATE POLICY "Authenticated users can read strategy cache"
ON public.ai_strategy_cache
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Restrict strategy_likes SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view strategy likes" ON public.strategy_likes;
CREATE POLICY "Authenticated users can view strategy likes"
ON public.strategy_likes
FOR SELECT
TO authenticated
USING (true);