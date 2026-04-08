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
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    // Get the user from the auth header
    const authHeader = req.headers.get("authorization");
    const supabaseUser = createClient(SUPABASE_URL!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature,
            // Legacy support for subscription-based flow
            razorpay_subscription_id } = body;

    // Support both order-based and subscription-based verification
    const isOrderBased = !!razorpay_order_id;
    const verifyId = razorpay_order_id || razorpay_subscription_id;

    if (!razorpay_payment_id || !verifyId || !razorpay_signature) {
      throw new Error("Missing payment verification fields");
    }

    // Verify signature: HMAC SHA256 of "order_id|payment_id" (or "payment_id|subscription_id")
    const encoder = new TextEncoder();
    const message = isOrderBased
      ? `${razorpay_order_id}|${razorpay_payment_id}`
      : `${razorpay_payment_id}|${razorpay_subscription_id}`;

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      console.error("Payment signature verification failed");
      throw new Error("Payment verification failed. Invalid signature.");
    }

    // Signature valid — activate subscription using service_role
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        razorpay_subscription_id: razorpay_order_id || razorpay_subscription_id,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update subscription:", updateError);
      throw new Error("Failed to activate subscription");
    }

    // Handle referral commission if applicable
    if (body.referral_code && body.affiliate_id) {
      try {
        // Create referral record if not exists
        const { data: existingRef } = await supabaseAdmin
          .from("referrals")
          .select("id")
          .eq("referred_user_id", user.id)
          .eq("affiliate_id", body.affiliate_id)
          .maybeSingle();

        const referralId = existingRef?.id;

        if (referralId) {
          // Update referral status to converted
          await supabaseAdmin
            .from("referrals")
            .update({
              status: "converted",
              converted_at: new Date().toISOString(),
              discount_applied: body.discount_percent || 0,
            })
            .eq("id", referralId);

          // Fetch commission settings
          const { data: settings } = await supabaseAdmin
            .from("affiliate_settings")
            .select("commission_percent")
            .limit(1)
            .single();

          const commissionPercent = settings?.commission_percent || 20;
          const amountPaid = body.amount_paid || 999;
          const commissionAmount = Math.round(amountPaid * commissionPercent / 100);

          // Create commission record
          await supabaseAdmin.from("commissions").insert({
            affiliate_id: body.affiliate_id,
            referral_id: referralId,
            referred_user_id: user.id,
            amount_paid: amountPaid,
            commission_percent: commissionPercent,
            commission_amount: commissionAmount,
            plan_purchased: "pro",
            status: "pending",
          });

          // Update affiliate stats atomically
          await supabaseAdmin.rpc("increment_affiliate_stats", {
            _affiliate_id: body.affiliate_id,
            _commission_amount: commissionAmount,
          });

          console.log(`Commission of ₹${commissionAmount} created for affiliate ${body.affiliate_id}`);
        }
      } catch (commErr: any) {
        console.error("Commission tracking error (non-fatal):", commErr?.message);
      }
    }

    console.log("Subscription activated for user:", user.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Activate subscription error:", error?.message);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Activation failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
