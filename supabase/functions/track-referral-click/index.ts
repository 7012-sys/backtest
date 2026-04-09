import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { referral_code } = await req.json();

    if (!referral_code || typeof referral_code !== "string" || referral_code.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const code = referral_code.trim().toUpperCase();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate affiliate exists and is active
    const { data: affiliate, error: affErr } = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("referral_code", code)
      .eq("status", "active")
      .single();

    if (affErr || !affiliate) {
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 5 clicks per referral_code per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("referral_clicks")
      .select("id", { count: "exact", head: true })
      .eq("referral_code", code)
      .gte("clicked_at", tenMinAgo);

    if ((count ?? 0) >= 5) {
      // Silently succeed but don't record (don't reveal rate limiting)
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the click (no IP/user_agent stored)
    await supabaseAdmin.from("referral_clicks").insert({
      affiliate_id: affiliate.id,
      referral_code: code,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("track-referral-click error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
