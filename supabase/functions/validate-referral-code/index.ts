import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Backend configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let currentUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      currentUserId = user?.id ?? null;
    }

    const body = await req.json().catch(() => ({}));
    const code = body?.code?.trim?.().toUpperCase?.() ?? "";

    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, message: "Please enter a referral code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, user_id, referral_code")
      .ilike("referral_code", code)
      .eq("status", "active")
      .maybeSingle();

    if (!affiliate) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid or inactive referral code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (currentUserId && affiliate.user_id === currentUserId) {
      return new Response(
        JSON.stringify({ valid: false, message: "You can't use your own referral code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { data: settings } = await supabase
      .from("affiliate_settings")
      .select("discount_percent, is_enabled")
      .limit(1)
      .single();

    if (!settings?.is_enabled || settings.discount_percent <= 0) {
      return new Response(
        JSON.stringify({ valid: false, message: "Referral program is currently unavailable" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        code: affiliate.referral_code,
        affiliate_id: affiliate.id,
        discount_percent: settings.discount_percent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ valid: false, message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});