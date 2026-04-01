
-- Fix 1: Remove user self-delete on user_roles (privilege escalation risk)
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;

-- Fix 2: Remove user self-update on subscriptions (users should not change their own plan/status)
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- Fix 3: Restrict strategy_likes SELECT to own likes only
DROP POLICY IF EXISTS "Authenticated users can view strategy likes" ON public.strategy_likes;
CREATE POLICY "Users can view own likes"
ON public.strategy_likes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add a count function for community strategy likes (so users can see like counts without exposing user_ids)
CREATE OR REPLACE FUNCTION public.get_strategy_like_count(_strategy_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.strategy_likes WHERE strategy_id = _strategy_id;
$$;
