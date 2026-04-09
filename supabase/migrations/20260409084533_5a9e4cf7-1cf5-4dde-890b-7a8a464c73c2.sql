
-- Function to increment total_clicks on affiliates when a referral click is inserted
CREATE OR REPLACE FUNCTION public.increment_affiliate_clicks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET total_clicks = total_clicks + 1,
      updated_at = now()
  WHERE id = NEW.affiliate_id;
  RETURN NEW;
END;
$$;

-- Trigger on referral_clicks insert
CREATE TRIGGER trg_increment_affiliate_clicks
AFTER INSERT ON public.referral_clicks
FOR EACH ROW
EXECUTE FUNCTION public.increment_affiliate_clicks();

-- Function to increment total_referrals on affiliates when a referral is inserted
CREATE OR REPLACE FUNCTION public.increment_affiliate_referrals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET total_referrals = total_referrals + 1,
      updated_at = now()
  WHERE id = NEW.affiliate_id;
  RETURN NEW;
END;
$$;

-- Trigger on referrals insert
CREATE TRIGGER trg_increment_affiliate_referrals
AFTER INSERT ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.increment_affiliate_referrals();
