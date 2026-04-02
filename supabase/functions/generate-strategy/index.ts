import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Indicator-based indicators
const TECHNICAL_INDICATORS = [
  "SMA", "EMA", "RSI", "MACD", "MACD Signal", "Bollinger Upper",
  "Bollinger Lower", "ATR", "VWAP", "Stochastic K", "Stochastic D",
  "ADX", "CCI", "Williams %R", "OBV", "Volume"
];

// Price action indicators
const PRICE_ACTION_INDICATORS = [
  "Price", "Open", "High", "Low", "Close",
  "Prev Day High", "Prev Day Low",
  "Opening Range High", "Opening Range Low",
  "Day High", "Day Low",
  "Inside Bar", "Bullish Engulfing", "Bearish Engulfing",
  "Hammer", "Shooting Star", "Doji",
  "High 20", "Low 20",
  "Gap Up", "Gap Down"
];

const ALL_INDICATORS = [...TECHNICAL_INDICATORS, ...PRICE_ACTION_INDICATORS];

const CONDITIONS = [
  "crosses_above", "crosses_below", "greater_than", "less_than", "equals"
];

const ADMIN_EMAIL = "dharnekunal2002@gmail.com";
const FREE_AI_DAILY_LIMIT = 5;

// Keywords that signal price action strategies
const PRICE_ACTION_KEYWORDS = [
  "opening range", "orb", "breakout", "prev day", "previous day",
  "previous high", "previous low", "support", "resistance",
  "price action", "candle", "candlestick", "inside bar",
  "engulfing", "hammer", "shooting star", "doji", "morning star",
  "retest", "higher high", "higher low", "lower high", "lower low",
  "trend continuation", "liquidity grab", "smart money",
  "gap up", "gap down", "range break", "consolidation",
  "day high", "day low", "end of day", "momentum",
  "breakout level", "price breaks", "price touches",
  "first 15 min", "first 30 min", "first hour",
];

function isPriceActionPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const priceActionScore = PRICE_ACTION_KEYWORDS.filter(kw => lower.includes(kw)).length;
  
  // Check if any technical indicators are explicitly mentioned
  const indicatorKeywords = ["rsi", "macd", "bollinger", "sma", "ema", "stochastic", "adx", "cci", "vwap", "atr", "obv", "williams"];
  const indicatorScore = indicatorKeywords.filter(kw => lower.includes(kw)).length;
  
  // If price action keywords are present and no indicators mentioned, it's price action
  return priceActionScore > 0 && indicatorScore === 0;
}

// ── Price Action Templates ──
const PRICE_ACTION_TEMPLATES: Array<{ keywords: string[]; minMatch: number; strategy: any }> = [
  {
    keywords: ["opening range", "orb", "first 15", "first 30", "first hour"],
    minMatch: 1,
    strategy: {
      name: "Opening Range Breakout (ORB)",
      description: "Buy when price breaks above the opening range high (first candle high). Sell when price breaks below opening range low.",
      entryRules: [
        { id: "r1", indicator: "Price", condition: "crosses_above", value: "Opening Range High", connector: "AND" },
      ],
      exitRules: [
        { id: "r2", indicator: "Price", condition: "crosses_below", value: "Opening Range Low", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["prev day", "previous day", "previous high", "previous low", "yesterday"],
    minMatch: 1,
    strategy: {
      name: "Previous Day High/Low Breakout",
      description: "Buy when price breaks above previous day high. Exit when price breaks below previous day low or at stop loss.",
      entryRules: [
        { id: "r1", indicator: "Price", condition: "crosses_above", value: "Prev Day High", connector: "AND" },
      ],
      exitRules: [
        { id: "r2", indicator: "Price", condition: "crosses_below", value: "Prev Day Low", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["inside", "inside bar", "inside candle"],
    minMatch: 1,
    strategy: {
      name: "Inside Candle Breakout",
      description: "Buy when price breaks above the high of the previous candle (inside bar pattern). Exit when price breaks below previous candle low.",
      entryRules: [
        { id: "r1", indicator: "Inside Bar", condition: "equals", value: "1", connector: "AND" },
        { id: "r2", indicator: "Price", condition: "crosses_above", value: "Prev Day High", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "Price", condition: "crosses_below", value: "Prev Day Low", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["gap up", "gap down", "gap"],
    minMatch: 1,
    strategy: {
      name: "Gap Up/Down Strategy",
      description: "Buy when market opens with a gap up and price continues above opening range. Exit at fixed target or stop loss.",
      entryRules: [
        { id: "r1", indicator: "Gap Up", condition: "equals", value: "1", connector: "AND" },
        { id: "r2", indicator: "Price", condition: "greater_than", value: "Opening Range High", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "Price", condition: "crosses_below", value: "Opening Range Low", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["range break", "consolidation", "sideways"],
    minMatch: 1,
    strategy: {
      name: "Range Breakout Strategy",
      description: "Buy when price breaks out of a 20-day range. Exit when price falls back below the range.",
      entryRules: [
        { id: "r1", indicator: "Price", condition: "crosses_above", value: "High 20", connector: "AND" },
      ],
      exitRules: [
        { id: "r2", indicator: "Price", condition: "crosses_below", value: "Low 20", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["higher high", "higher low", "trend continuation"],
    minMatch: 1,
    strategy: {
      name: "Trend Continuation (HH/HL)",
      description: "Buy when price makes higher highs and breaks previous day high in an uptrend.",
      entryRules: [
        { id: "r1", indicator: "High", condition: "greater_than", value: "Prev Day High", connector: "AND" },
        { id: "r2", indicator: "Low", condition: "greater_than", value: "Prev Day Low", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "Low", condition: "less_than", value: "Prev Day Low", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["support", "resistance", "bounce", "touch"],
    minMatch: 1,
    strategy: {
      name: "Support & Resistance Bounce",
      description: "Buy when price touches the 20-day low (support) and bounces up. Exit at resistance (20-day high).",
      entryRules: [
        { id: "r1", indicator: "Price", condition: "less_than", value: "Low 20", connector: "AND" },
        { id: "r2", indicator: "Bullish Engulfing", condition: "equals", value: "1", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "Price", condition: "greater_than", value: "High 20", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["liquidity grab", "smart money", "reversal", "fake breakout"],
    minMatch: 1,
    strategy: {
      name: "Liquidity Grab Reversal",
      description: "Buy when price takes out previous low and quickly reverses up (liquidity grab).",
      entryRules: [
        { id: "r1", indicator: "Low", condition: "less_than", value: "Prev Day Low", connector: "AND" },
        { id: "r2", indicator: "Price", condition: "greater_than", value: "Prev Day Low", connector: "AND" },
      ],
      exitRules: [
        { id: "r3", indicator: "Price", condition: "greater_than", value: "Prev Day High", connector: "OR" },
      ],
    },
  },
  {
    keywords: ["end of day", "last 30 min", "closing", "eod momentum"],
    minMatch: 1,
    strategy: {
      name: "End of Day Momentum",
      description: "Buy when price is near day high. Simple momentum play into the close.",
      entryRules: [
        { id: "r1", indicator: "Price", condition: "greater_than", value: "Day High", connector: "AND" },
      ],
      exitRules: [
        { id: "r2", indicator: "Price", condition: "crosses_below", value: "Prev Day Low", connector: "OR" },
      ],
    },
  },
];

// ── Technical Indicator Templates ──
const INDICATOR_TEMPLATES: Array<{ keywords: string[]; strategy: any }> = [
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
];

function matchTemplate(prompt: string): any | null {
  const lower = prompt.toLowerCase();
  
  // Check price action templates first
  const isPriceAction = isPriceActionPrompt(prompt);
  
  if (isPriceAction) {
    for (const template of PRICE_ACTION_TEMPLATES) {
      const matchCount = template.keywords.filter(kw => lower.includes(kw)).length;
      if (matchCount >= (template.minMatch || 1)) {
        return template.strategy;
      }
    }
  }
  
  // Then check indicator templates
  for (const template of INDICATOR_TEMPLATES) {
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

    // ── Check daily usage limit ──
    if (!isAdmin) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await serviceClient
        .from("ai_usage")
        .select("request_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      const currentCount = usageData?.request_count || 0;

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

    // ── Step 1: Try template matching ──
    const templateMatch = matchTemplate(prompt);
    if (templateMatch) {
      console.log("Template match found for prompt");
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
      await serviceClient
        .from("ai_strategy_cache")
        .update({ usage_count: 1 })
        .eq("prompt_hash", promptHash);
      await trackUsage(serviceClient, user.id);
      return new Response(JSON.stringify({ success: true, data: cached.strategy_json }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 3: Detect strategy type and build appropriate prompt ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const priceAction = isPriceActionPrompt(prompt);
    
    const systemPrompt = priceAction
      ? `You are an expert trading strategy generator specializing in PRICE ACTION strategies.

The user is describing a price action strategy. Do NOT use technical indicators like RSI, MACD, ADX, Bollinger Bands, etc. unless the user explicitly mentions them.

Available price action indicators: ${PRICE_ACTION_INDICATORS.join(", ")}
Available conditions: ${CONDITIONS.join(", ")}

IMPORTANT RULES:
- Use ONLY price-based rules (Price, High, Low, Open, Close, Prev Day High, Prev Day Low, Opening Range High, Opening Range Low, Day High, Day Low, High 20, Low 20)
- Use candlestick patterns (Inside Bar, Bullish Engulfing, Bearish Engulfing, Hammer, Doji) when appropriate
- Use Gap Up / Gap Down when the user mentions gaps
- Do NOT add RSI, MACD, ADX, VWAP, or any indicator unless the user explicitly asks for it
- Keep strategies faithful to the user's price action concept
- For breakout strategies, use "crosses_above" or "crosses_below" conditions
- For pattern detection, use "equals" with value "1"

Generate a strategy with name, description, entry rules, and exit rules.`
      : `You are an expert trading strategy generator. Given a user's trading idea in plain English, generate structured trading rules.

Available indicators: ${ALL_INDICATORS.join(", ")}
Available conditions: ${CONDITIONS.join(", ")}

IMPORTANT RULES:
- Only use indicators the user mentions or that are directly related to their concept
- Do NOT add unrelated indicators just to fill rules
- If the user mentions price levels, support/resistance, breakouts without indicators, use price-based rules (Price, High, Low, Prev Day High, Prev Day Low, etc.)
- Keep strategies practical and based on sound technical analysis principles

Generate a strategy with a name, description, entry rules, and exit rules. Each rule must use only the available indicators and conditions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt.trim() },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_strategy",
              description: "Create a structured trading strategy with entry and exit rules",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Short strategy name (max 50 chars)" },
                  description: { type: "string", description: "Brief description (max 200 chars)" },
                  entryRules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        indicator: { type: "string", enum: ALL_INDICATORS },
                        condition: { type: "string", enum: CONDITIONS },
                        value: { type: "string" },
                        connector: { type: "string", enum: ["AND", "OR"] },
                      },
                      required: ["id", "indicator", "condition", "value", "connector"],
                      additionalProperties: false,
                    },
                  },
                  exitRules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        indicator: { type: "string", enum: ALL_INDICATORS },
                        condition: { type: "string", enum: CONDITIONS },
                        value: { type: "string" },
                        connector: { type: "string", enum: ["AND", "OR"] },
                      },
                      required: ["id", "indicator", "condition", "value", "connector"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["name", "description", "entryRules", "exitRules"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_strategy" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "AI rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI service payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ success: false, error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    
    let strategy;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        strategy = JSON.parse(toolCall.function.arguments);
      } catch (_parseError) {
        console.error("Failed to parse tool call response:", toolCall.function.arguments);
        throw new Error("Failed to parse AI response");
      }
    } else {
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No response from AI");
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
        strategy = JSON.parse(jsonStr);
      } catch (_parseError) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Failed to parse AI response");
      }
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
