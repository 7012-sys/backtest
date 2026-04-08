
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.referral_clicks;
CREATE POLICY "Valid referral clicks only" ON public.referral_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.referral_code = referral_clicks.referral_code AND affiliates.status = 'active'));
