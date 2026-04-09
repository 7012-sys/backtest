
-- Remove the existing anon INSERT policy that allows click fraud
DROP POLICY IF EXISTS "Valid referral clicks only" ON public.referral_clicks;

-- Only allow service_role to insert clicks (via edge function)
CREATE POLICY "Service role can insert clicks"
ON public.referral_clicks
FOR INSERT
TO service_role
WITH CHECK (true);

-- Drop sensitive columns that affiliates shouldn't see
ALTER TABLE public.referral_clicks DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.referral_clicks DROP COLUMN IF EXISTS user_agent;
