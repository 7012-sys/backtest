-- 1. FIX: Subscriptions - Remove user self-update policy (upgrades must go through payment/admin)
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- Attach the existing prevent_subscription_self_upgrade trigger function
DROP TRIGGER IF EXISTS prevent_subscription_self_upgrade ON public.subscriptions;
CREATE TRIGGER prevent_subscription_self_upgrade
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_subscription_self_upgrade();

-- 2. FIX: User roles - Attach the existing prevent_role_self_escalation trigger function
DROP TRIGGER IF EXISTS prevent_role_self_escalation ON public.user_roles;
CREATE TRIGGER prevent_role_self_escalation
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 3. FIX: Affiliates - Replace UPDATE policy with restricted one
DROP POLICY IF EXISTS "Users can update own affiliate" ON public.affiliates;

CREATE POLICY "Users can update own affiliate"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND total_clicks = (SELECT a.total_clicks FROM public.affiliates a WHERE a.id = affiliates.id)
    AND total_referrals = (SELECT a.total_referrals FROM public.affiliates a WHERE a.id = affiliates.id)
    AND total_earnings = (SELECT a.total_earnings FROM public.affiliates a WHERE a.id = affiliates.id)
    AND pending_earnings = (SELECT a.pending_earnings FROM public.affiliates a WHERE a.id = affiliates.id)
    AND withdrawn_earnings = (SELECT a.withdrawn_earnings FROM public.affiliates a WHERE a.id = affiliates.id)
    AND total_paid_referrals = (SELECT a.total_paid_referrals FROM public.affiliates a WHERE a.id = affiliates.id)
  );