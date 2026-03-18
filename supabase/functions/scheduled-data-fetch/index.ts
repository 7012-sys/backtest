import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All symbols to pre-fetch daily
const SYMBOLS = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
const TIMEFRAMES = ['1d', '1h', '15m', '5m'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Fetch yesterday's and today's data for each symbol/timeframe combo
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    
    // For daily, fetch last 7 days to fill any gaps
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startDate = weekAgo.toISOString().split('T')[0];

    const results: string[] = [];

    for (const symbol of SYMBOLS) {
      for (const timeframe of TIMEFRAMES) {
        try {
          // Call the existing fetch-market-data function
          const resp = await fetch(`${SUPABASE_URL}/functions/v1/fetch-market-data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ symbol, startDate, endDate, timeframe }),
          });

          const data = await resp.json();
          if (data.success) {
            results.push(`✅ ${symbol}/${timeframe}: ${data.meta?.count || 0} candles`);
          } else {
            results.push(`⚠️ ${symbol}/${timeframe}: ${data.error || 'unknown error'}`);
          }
        } catch (err: any) {
          results.push(`❌ ${symbol}/${timeframe}: ${err.message}`);
        }
      }
    }

    console.log('Scheduled data fetch completed:', results.join('\n'));

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Scheduled fetch error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
