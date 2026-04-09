import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_PRICE_PAISE = 99900; // ₹999 in paise

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    // Parse request body for referral code — ONLY use what the client explicitly sends
    let referralCode: string | null = null;
    try {
      const body = await req.json();
      referralCode = body?.referral_code?.trim()?.toUpperCase() || null;
    } catch {
      // No body or invalid JSON — no referral code
    }

    console.log("Creating order for user:", user.id, "referral:", referralCode);

    let finalPricePaise = BASE_PRICE_PAISE;
    let discountPercent = 0;
    let affiliateId: string | null = null;

    // Server-side referral code validation
    if (referralCode) {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id, user_id, status")
        .eq("referral_code", referralCode)
        .eq("status", "active")
        .single();

      if (affiliate && affiliate.user_id !== user.id) {
        // Valid referral, not self-referral — fetch discount
        const { data: settings } = await supabase
          .from("affiliate_settings")
          .select("discount_percent, is_enabled")
          .limit(1)
          .single();

        if (settings?.is_enabled && settings.discount_percent > 0) {
          discountPercent = settings.discount_percent;
          finalPricePaise = Math.round(BASE_PRICE_PAISE * (1 - discountPercent / 100));
          affiliateId = affiliate.id;
          console.log(`Discount applied: ${discountPercent}%, final: ${finalPricePaise} paise`);
        }
      } else {
        console.log("Invalid referral: self-referral or not found");
      }
    }

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Create a Razorpay ORDER (not subscription) so we can set custom amount
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: finalPricePaise,
        currency: "INR",
        receipt: `pro_${user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          plan_type: "pro_monthly",
          referral_code: referralCode || "",
          affiliate_id: affiliateId || "",
          discount_percent: discountPercent,
          original_amount: BASE_PRICE_PAISE,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json().catch(() => ({}));
      console.error("Failed to create order:", JSON.stringify(errorData));
      throw new Error(`Razorpay error: ${errorData?.error?.description || "Unknown error"}`);
    }

    const order = await orderResponse.json();
    console.log("Created order:", order.id, "amount:", order.amount);

    // Store order info on the subscription record
    await supabase
      .from("subscriptions")
      .update({
        razorpay_subscription_id: order.id, // reuse column for order_id
        status: "pending",
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: RAZORPAY_KEY_ID,
          discount_percent: discountPercent,
          referral_code: referralCode,
          affiliate_id: affiliateId,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error?.message);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
