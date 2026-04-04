
-- Fix 1: Prevent subscription self-upgrade with a validation trigger
CREATE OR REPLACE FUNCTION public.prevent_subscription_self_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role to do anything (webhooks, edge functions)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow admins to do anything
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- For regular users: only allow downgrade to 'free' or status changes to 'expired'/'cancelled'
  IF NEW.plan IS DISTINCT FROM OLD.plan AND NEW.plan != 'free' THEN
    RAISE EXCEPTION 'Cannot upgrade plan directly. Use payment flow.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('expired', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot change subscription status directly.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_subscription_update
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_subscription_self_upgrade();

-- Fix 2: Add explicit DELETE/UPDATE policies on strategy_versions
CREATE POLICY "Users can delete own strategy versions"
ON public.strategy_versions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM strategies
    WHERE strategies.id = strategy_versions.strategy_id
    AND strategies.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own strategy versions"
ON public.strategy_versions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM strategies
    WHERE strategies.id = strategy_versions.strategy_id
    AND strategies.user_id = auth.uid()
  )
);
