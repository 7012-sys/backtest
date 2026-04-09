import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const REFERRAL_COOKIE_KEY = "tradetest_ref";
const REFERRAL_SOURCE_KEY = "tradetest_ref_source";
const REFERRAL_EXPIRY_DAYS = 30;

export const setReferralCookie = (code: string, source: "link" | "manual" = "manual") => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + REFERRAL_EXPIRY_DAYS);
  document.cookie = `${REFERRAL_COOKIE_KEY}=${encodeURIComponent(code)};expires=${expiry.toUTCString()};path=/;SameSite=Lax`;
  document.cookie = `${REFERRAL_SOURCE_KEY}=${source};expires=${expiry.toUTCString()};path=/;SameSite=Lax`;
};

export const getReferralCode = (): string | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_COOKIE_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const getReferralSource = (): string | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_SOURCE_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const clearReferralCookie = () => {
  document.cookie = `${REFERRAL_COOKIE_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  document.cookie = `${REFERRAL_SOURCE_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
};

/**
 * Hook to detect referral code from URL params and store it
 */
export const useReferralDetection = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    
    if (ref) {
      setReferralCookie(ref, "link");
      setReferralCode(ref);
      // Track the click
      trackClick(ref);
      // Remove ref from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.toString());
    } else {
      const stored = getReferralCode();
      if (stored) setReferralCode(stored);
    }
  }, []);

  useEffect(() => {
    if (referralCode) {
      fetchDiscount();
    }
  }, [referralCode]);

  const fetchDiscount = async () => {
    const { data } = await supabase
      .from("affiliate_settings")
      .select("discount_percent, is_enabled")
      .limit(1)
      .single();
    
    if (data?.is_enabled) {
      setDiscount(data.discount_percent);
    }
  };

  return { referralCode, discount };
};

const trackClick = async (code: string) => {
  try {
    // Look up affiliate by code
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("referral_code", code)
      .eq("status", "active")
      .single();

    if (!affiliate) return;

    await supabase.from("referral_clicks").insert({
      affiliate_id: affiliate.id,
      referral_code: code,
    });
  } catch (e) {
    // Silent fail for click tracking
  }
};

/**
 * Link a newly signed-up user to a referral
 */
export const linkReferral = async (userId: string) => {
  const code = getReferralCode();
  if (!code) return;

  try {
    // Get affiliate
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("referral_code", code)
      .eq("status", "active")
      .single();

    if (!affiliate) return;

    // Check not self-referral
    const { data: affiliateRecord } = await supabase
      .from("affiliates")
      .select("user_id")
      .eq("id", affiliate.id)
      .single();
    
    if (affiliateRecord?.user_id === userId) return;

    // Create referral record
    await supabase.from("referrals").insert({
      affiliate_id: affiliate.id,
      referred_user_id: userId,
      referral_code: code,
    });

    // Update profile with referral code
    await supabase
      .from("profiles")
      .update({ referred_by: code })
      .eq("user_id", userId);

    clearReferralCookie();
  } catch (e) {
    console.error("Error linking referral:", e);
  }
};
