
CREATE OR REPLACE FUNCTION public.increment_affiliate_stats(
  _affiliate_id uuid,
  _commission_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.affiliates
  SET
    total_paid_referrals = total_paid_referrals + 1,
    total_earnings = total_earnings + _commission_amount,
    pending_earnings = pending_earnings + _commission_amount,
    updated_at = now()
  WHERE id = _affiliate_id;
END;
$$;
