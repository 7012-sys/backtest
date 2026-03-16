import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
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
      throw new Error("Razorpay secret not configured");
    }

    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Verify webhook signature
    if (signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(RAZORPAY_KEY_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (expectedSignature !== signature) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ success: false, error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const event = JSON.parse(body);
    console.log("Webhook event:", event.event);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const payload = event.payload;
    const subscriptionEntity = payload?.subscription?.entity;

    if (!subscriptionEntity) {
      console.log("No subscription entity in payload");
      return new Response(
        JSON.stringify({ success: true, data: { received: true } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpaySubId = subscriptionEntity.id;
    const userId = subscriptionEntity.notes?.user_id;

    console.log("Processing subscription:", razorpaySubId, "for user:", userId);

    switch (event.event) {
      case "subscription.authenticated":
      case "subscription.activated":
        console.log("Subscription activated");
        await supabase
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("razorpay_subscription_id", razorpaySubId);
        break;

      case "subscription.charged":
        console.log("Subscription charged - renewing");
        await supabase
          .from("subscriptions")
          .update({
            plan: "pro",
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("razorpay_subscription_id", razorpaySubId);
        break;

      case "subscription.cancelled":
        console.log("Subscription cancelled");
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("razorpay_subscription_id", razorpaySubId);
        break;

      case "subscription.halted":
      case "subscription.expired":
        console.log("Subscription expired/halted");
        await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "expired",
          })
          .eq("razorpay_subscription_id", razorpaySubId);
        break;

      default:
        console.log("Unhandled event:", event.event);
    }

    return new Response(
      JSON.stringify({ success: true, data: { received: true, event: event.event } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook error:", error?.message);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Webhook processing failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
