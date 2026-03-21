import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { metrics, symbol, entryRules, exitRules } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a trading strategy analyst. Given these backtest results, write a 3-4 sentence plain-English summary that a beginner trader can understand. Be direct, mention whether the strategy is worth pursuing, highlight the biggest strength and weakness.

Symbol: ${symbol}
Strategy Entry Rules: ${JSON.stringify(entryRules || [])}
Strategy Exit Rules: ${JSON.stringify(exitRules || [])}

Performance:
- Net P&L: ₹${metrics.netPnl}
- ROI: ${metrics.roi}%
- CAGR: ${metrics.cagr || 'N/A'}%
- Win Rate: ${metrics.winRate}%
- Total Trades: ${metrics.totalTrades}
- Profit Factor: ${metrics.profitFactor}
- Max Drawdown: ${metrics.maxDrawdown}
- Sharpe Ratio: ${metrics.sharpeRatio}
- Sortino Ratio: ${metrics.sortinoRatio || 'N/A'}
- Expectancy: ₹${metrics.expectancy || 'N/A'}

Write only the summary, no headings or bullet points.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a concise trading analyst. Keep responses under 4 sentences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backtest-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
