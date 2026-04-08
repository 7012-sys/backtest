
-- Affiliate settings (singleton config table)
CREATE TABLE public.affiliate_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percent numeric NOT NULL DEFAULT 20,
  discount_percent numeric NOT NULL DEFAULT 50,
  min_withdrawal numeric NOT NULL DEFAULT 1000,
  is_enabled boolean NOT NULL DEFAULT true,
  attribution_window_days integer NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.affiliate_settings (commission_percent, discount_percent, min_withdrawal, is_enabled, attribution_window_days)
VALUES (20, 50, 1000, true, 30);

ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read affiliate settings" ON public.affiliate_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update affiliate settings" ON public.affiliate_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Affiliates table
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL UNIQUE,
  code_edited boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  payment_upi text,
  payment_bank_name text,
  payment_bank_account text,
  payment_bank_ifsc text,
  total_clicks integer NOT NULL DEFAULT 0,
  total_referrals integer NOT NULL DEFAULT 0,
  total_paid_referrals integer NOT NULL DEFAULT 0,
  total_earnings numeric NOT NULL DEFAULT 0,
  pending_earnings numeric NOT NULL DEFAULT 0,
  withdrawn_earnings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate" ON public.affiliates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliate" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all affiliates" ON public.affiliates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all affiliates" ON public.affiliates FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Referral clicks tracking
CREATE TABLE public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  ip_address text,
  user_agent text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own clicks" ON public.referral_clicks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = referral_clicks.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Anyone can insert clicks" ON public.referral_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view all clicks" ON public.referral_clicks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Referrals table (links referred user to affiliate)
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'converted', 'expired')),
  discount_applied numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  UNIQUE(referred_user_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = referrals.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Service role can manage referrals" ON public.referrals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_user_id);
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Commissions table
CREATE TABLE public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_purchased text NOT NULL,
  amount_paid numeric NOT NULL,
  commission_percent numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz
);

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own commissions" ON public.commissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.affiliates WHERE affiliates.id = commissions.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Admins can view all commissions" ON public.commissions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update commissions" ON public.commissions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role can insert commissions" ON public.commissions FOR INSERT TO service_role WITH CHECK (true);

-- Withdrawal requests
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'upi',
  payment_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add referral_code column to profiles for tracking which code was used at signup
ALTER TABLE public.profiles ADD COLUMN referred_by text;

-- Create indexes
CREATE INDEX idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_referrals_affiliate_id ON public.referrals(affiliate_id);
CREATE INDEX idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX idx_commissions_affiliate_id ON public.commissions(affiliate_id);
CREATE INDEX idx_referral_clicks_affiliate_id ON public.referral_clicks(affiliate_id);
CREATE INDEX idx_referral_clicks_clicked_at ON public.referral_clicks(clicked_at);
CREATE INDEX idx_withdrawal_requests_affiliate_id ON public.withdrawal_requests(affiliate_id);

-- Add affiliate role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'affiliate';
