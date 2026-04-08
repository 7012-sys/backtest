import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AffiliateData {
  id: string;
  referral_code: string;
  code_edited: boolean;
  status: string;
  payment_upi: string | null;
  payment_bank_name: string | null;
  payment_bank_account: string | null;
  payment_bank_ifsc: string | null;
  total_clicks: number;
  total_referrals: number;
  total_paid_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  withdrawn_earnings: number;
  created_at: string;
}

interface AffiliateSettings {
  commission_percent: number;
  discount_percent: number;
  min_withdrawal: number;
  is_enabled: boolean;
}

interface DailyClick {
  date: string;
  clicks: number;
}

export const useAffiliate = (userId: string | undefined) => {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [dailyClicks, setDailyClicks] = useState<DailyClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    const [{ data: aff }, { data: sett }] = await Promise.all([
      supabase.from("affiliates").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("affiliate_settings").select("*").limit(1).single(),
    ]);

    setAffiliate(aff);
    setIsAffiliate(!!aff);
    setSettings(sett);

    if (aff) {
      // Fetch daily clicks for last 30 days
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: clicks } = await supabase
        .from("referral_clicks")
        .select("clicked_at")
        .eq("affiliate_id", aff.id)
        .gte("clicked_at", since.toISOString());

      const clickMap: Record<string, number> = {};
      clicks?.forEach((c) => {
        const d = new Date(c.clicked_at).toISOString().split("T")[0];
        clickMap[d] = (clickMap[d] || 0) + 1;
      });

      const dailyData: DailyClick[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dailyData.push({ date: key, clicks: clickMap[key] || 0 });
      }
      setDailyClicks(dailyData);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const becomeAffiliate = async () => {
    // Disabled: only admins can assign affiliate role
    return { data: null, error: { message: "Only admins can assign affiliate access" } };
  };

  const updatePaymentInfo = async (info: { payment_upi?: string; payment_bank_name?: string; payment_bank_account?: string; payment_bank_ifsc?: string }) => {
    if (!affiliate) return;
    const { error } = await supabase.from("affiliates").update(info).eq("id", affiliate.id);
    if (!error) await fetchData();
    return { error };
  };

  const updateReferralCode = async (newCode: string) => {
    if (!affiliate || affiliate.code_edited) return { error: { message: "Code can only be edited once" } };
    const { error } = await supabase.from("affiliates").update({ referral_code: newCode, code_edited: true }).eq("id", affiliate.id);
    if (!error) await fetchData();
    return { error };
  };

  const requestWithdrawal = async (amount: number, method: string, details: any) => {
    if (!affiliate || !userId) return;
    const { error } = await supabase.from("withdrawal_requests").insert({
      affiliate_id: affiliate.id,
      user_id: userId,
      amount,
      payment_method: method,
      payment_details: details,
    });
    if (!error) await fetchData();
    return { error };
  };

  return {
    affiliate,
    settings,
    dailyClicks,
    loading,
    isAffiliate,
    becomeAffiliate,
    updatePaymentInfo,
    updateReferralCode,
    requestWithdrawal,
    refresh: fetchData,
  };
};
