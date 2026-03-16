import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INDICATORS = [
  "SMA", "EMA", "RSI", "MACD", "MACD Signal", "Bollinger Upper", 
  "Bollinger Lower", "ATR", "VWAP", "Stochastic K", "Stochastic D",
  "ADX", "CCI", "Williams %R", "OBV", "Price", "Volume"
];

const CONDITIONS = [
  "crosses_above", "crosses_below", "greater_than", "less_than", "equals"
];

const ADMIN_EMAIL = "dharnekunal2002@gmail.com";
const FREE_AI_DAILY_LIMIT = 5;

// ── Template matching: common prompts → pre-built strategies ──
const STRATEGY_TEMPLATES: Array<{ keywords: string[]; strategy: any }> = [
  {
    keywords: ["rsi", "oversold", "bounce"],
    strategy: {
      name: "RSI Oversold Bounce",
      description: "Buy when RSI crosses above 30 from oversold territory",
      entryRules: [
        { id: "r1", indicator: "RSI", condition: "crosses_above", value: "30", connector: "AND" },
        { id: "r2", indicator: "Price", condition: "greater_than", value: "SMA", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "RSI", condition: "greater_than", value: "70", connector: "OR" },
        { id: "r4", indicator: "Price", condition: "crosses_below", value: "SMA", connector: "AND" },
      ],
    },
  },
  {
    keywords: ["golden", "cross", "sma"],
    strategy: {
      name: "Golden Cross Strategy",
      description: "SMA 50 crosses above SMA 200 with volume confirmation",
      entryRules: [
        { id: "r1", indicator: "SMA", condition: "crosses_above", value: "EMA", connector: "AND" },
        { id: "r2", indicator: "RSI", condition: "less_than", value: "70", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "SMA", condition: "crosses_below", value: "EMA", connector: "OR" },
        { id: "r4", indicator: "RSI", condition: "greater_than", value: "80", connector: "AND" },
      ],
    },
  },
  {
    keywords: ["bollinger", "mean", "reversion"],
    strategy: {
      name: "Bollinger Mean Reversion",
      description: "Buy at lower Bollinger Band, sell at upper",
      entryRules: [
        { id: "r1", indicator: "Price", condition: "less_than", value: "Bollinger Lower", connector: "AND" },
        { id: "r2", indicator: "RSI", condition: "less_than", value: "35", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "Price", condition: "greater_than", value: "Bollinger Upper", connector: "OR" },
        { id: "r4", indicator: "RSI", condition: "greater_than", value: "65", connector: "AND" },
      ],
    },
  },
  {
    keywords: ["macd", "crossover", "signal"],
    strategy: {
      name: "MACD Crossover",
      description: "Enter on MACD crossing above signal line",
      entryRules: [
        { id: "r1", indicator: "MACD", condition: "crosses_above", value: "MACD Signal", connector: "AND" },
        { id: "r2", indicator: "ADX", condition: "greater_than", value: "20", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "MACD", condition: "crosses_below", value: "MACD Signal", connector: "OR" },
        { id: "r4", indicator: "RSI", condition: "greater_than", value: "75", connector: "AND" },
      ],
    },
  },
  {
    keywords: ["momentum", "breakout", "volume"],
    strategy: {
      name: "Momentum Breakout",
      description: "Breakout above 20-day high with volume surge",
      entryRules: [
        { id: "r1", indicator: "Price", condition: "greater_than", value: "SMA", connector: "AND" },
        { id: "r2", indicator: "RSI", condition: "greater_than", value: "50", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "RSI", condition: "greater_than", value: "75", connector: "OR" },
        { id: "r4", indicator: "Price", condition: "crosses_below", value: "EMA", connector: "AND" },
      ],
    },
  },
];

function matchTemplate(prompt: string): any | null {
  const lower = prompt.toLowerCase();
  for (const template of STRATEGY_TEMPLATES) {
    const matchCount = template.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount >= 2) {
      return template.strategy;
    }
  }
  return null;
}

// Simple hash for prompt caching
async function hashPrompt(prompt: string): Promise<string> {
  const normalized = prompt.toLowerCase().trim().replace(/\s+/g, ' ');
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth with anon key
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = authData.user;
    const isAdmin = user.email === ADMIN_EMAIL;

    // Service role client for cache/usage operations
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (prompt.length > 2000) {
      return new Response(
        JSON.stringify({ success: false, error: "Prompt too long (max 2000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check daily usage limit for non-admin users ──
    if (!isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await serviceClient
        .from("ai_usage")
        .select("request_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      const currentCount = usageData?.request_count || 0;

      // Check subscription for pro status
      const { data: subData } = await serviceClient
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .maybeSingle();

      const isPro = subData?.plan === "pro" && subData?.status === "active";
      const dailyLimit = isPro ? 50 : FREE_AI_DAILY_LIMIT;

      if (currentCount >= dailyLimit) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Daily AI strategy limit reached (${dailyLimit}/day). ${isPro ? 'Try again tomorrow.' : 'Upgrade to Pro for more.'}`
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Step 1: Try template matching (free, instant) ──
    const templateMatch = matchTemplate(prompt);
    if (templateMatch) {
      console.log("Template match found for prompt");
      // Track usage
      await trackUsage(serviceClient, user.id);
      return new Response(JSON.stringify({ success: true, data: templateMatch }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: Check cache ──
    const promptHash = await hashPrompt(prompt);
    const { data: cached } = await serviceClient
      .from("ai_strategy_cache")
      .select("strategy_json")
      .eq("prompt_hash", promptHash)
      .maybeSingle();

    if (cached) {
      console.log("Cache hit for strategy prompt");
      // Increment usage count
      await serviceClient
        .from("ai_strategy_cache")
        .update({ usage_count: 1 }) // Will be incremented via SQL if needed
        .eq("prompt_hash", promptHash);
      await trackUsage(serviceClient, user.id);
      return new Response(JSON.stringify({ success: true, data: cached.strategy_json }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 3: Call OpenAI ──
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert trading strategy generator. Given a user's trading idea in plain English, generate structured trading rules.

Available indicators: ${INDICATORS.join(", ")}
Available conditions: ${CONDITIONS.join(", ")}

You must respond with a JSON object containing:
- name: A short, descriptive strategy name (max 50 chars)
- description: A brief description of the strategy (max 200 chars)
- entryRules: Array of entry rule objects
- exitRules: Array of exit rule objects

Each rule object must have:
- id: A unique string ID (use uuid-like format)
- indicator: One of the available indicators
- condition: One of the available conditions
- value: A number or indicator name for comparison
- connector: "AND" or "OR" (for connecting to next rule)

Always include at least one entry rule and one exit rule. Keep strategies practical and based on sound technical analysis principles.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt.trim() },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "AI rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ success: false, error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    let strategy;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      strategy = JSON.parse(jsonStr);
    } catch (_parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // ── Step 4: Cache the result ──
    await serviceClient
      .from("ai_strategy_cache")
      .upsert({
        prompt_hash: promptHash,
        prompt: prompt.trim().substring(0, 500),
        strategy_json: strategy,
        usage_count: 1,
      }, { onConflict: "prompt_hash" });

    // Track usage
    await trackUsage(serviceClient, user.id);

    return new Response(JSON.stringify({ success: true, data: strategy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("generate-strategy error:", error);
    return new Response(JSON.stringify({ success: false, error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function trackUsage(client: any, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await client
    .from("ai_usage")
    .select("request_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  if (existing) {
    await client
      .from("ai_usage")
      .update({ request_count: existing.request_count + 1 })
      .eq("user_id", userId)
      .eq("usage_date", today);
  } else {
    await client
      .from("ai_usage")
      .insert({ user_id: userId, usage_date: today, request_count: 1 });
  }
}
