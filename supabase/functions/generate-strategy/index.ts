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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { prompt } = await req.json();

    // Validate input
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (prompt.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Prompt too long (max 2000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

Example response:
{
  "name": "Golden Cross Strategy",
  "description": "Uses SMA crossovers with RSI confirmation for trend following",
  "entryRules": [
    {"id": "r1", "indicator": "SMA", "condition": "crosses_above", "value": "EMA", "connector": "AND"},
    {"id": "r2", "indicator": "RSI", "condition": "less_than", "value": "70", "connector": "AND"}
  ],
  "exitRules": [
    {"id": "r3", "indicator": "SMA", "condition": "crosses_below", "value": "EMA", "connector": "OR"},
    {"id": "r4", "indicator": "RSI", "condition": "greater_than", "value": "80", "connector": "AND"}
  ]
}

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON from the response
    let strategy;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      strategy = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(strategy), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-strategy error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
