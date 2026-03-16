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
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
    const RAZORPAY_PLAN_ID = Deno.env.get("RAZORPAY_PLAN_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    if (!RAZORPAY_PLAN_ID) {
      throw new Error("Razorpay Plan ID not configured. Please add RAZORPAY_PLAN_ID secret.");
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

    console.log("Creating subscription for user:", user.id);

    const credentials = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Check if user already has a Razorpay customer ID
    let customerId: string;
    
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("razorpay_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existingSub?.razorpay_customer_id) {
      customerId = existingSub.razorpay_customer_id;
    } else {
      const customerResponse = await fetch("https://api.razorpay.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.email?.split("@")[0] || "User",
          email: user.email,
        }),
      });

      const customerData = await customerResponse.json();

      if (!customerResponse.ok) {
        // If customer already exists, fetch existing customer by email
        if (customerData?.error?.description?.includes("already exists")) {
          console.log("Customer already exists, fetching existing customer...");
          const searchResponse = await fetch(
            `https://api.razorpay.com/v1/customers?email=${encodeURIComponent(user.email!)}`,
            {
              headers: { "Authorization": `Basic ${credentials}` },
            }
          );
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.items && searchData.items.length > 0) {
              customerId = searchData.items[0].id;
            } else {
              throw new Error("Could not find existing Razorpay customer");
            }
          } else {
            throw new Error("Failed to search for existing Razorpay customer");
          }
        } else {
          console.error("Failed to create customer:", JSON.stringify(customerData));
          throw new Error("Failed to create Razorpay customer");
        }
      } else {
        customerId = customerData.id;
      }
    }

    // Create subscription using the plan ID from secrets
    const subscriptionResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: RAZORPAY_PLAN_ID,
        customer_id: customerId,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          plan_type: "monthly",
          amount: 499,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      console.error("Failed to create subscription:", errorText);
      throw new Error("Failed to create subscription. Please check your Razorpay plan configuration.");
    }

    const subscription = await subscriptionResponse.json();
    console.log("Created subscription:", subscription.id);

    // Store the razorpay IDs on the user's subscription record
    await supabase
      .from("subscriptions")
      .update({
        razorpay_customer_id: customerId,
        razorpay_subscription_id: subscription.id,
        status: "pending",
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          subscription_id: subscription.id,
          short_url: subscription.short_url,
          key_id: RAZORPAY_KEY_ID,
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
