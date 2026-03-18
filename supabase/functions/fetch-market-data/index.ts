import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Allowed symbols (NIFTY50, NIFTY Bank + 4 stocks) ──
const ALLOWED_SYMBOLS: Record<string, { twelveDataSymbol: string; label: string }> = {
  'NIFTY50':    { twelveDataSymbol: 'NIFTY 50',    label: 'NIFTY 50' },
  'BANKNIFTY':  { twelveDataSymbol: 'NIFTY BANK',  label: 'NIFTY Bank' },
  'RELIANCE':   { twelveDataSymbol: 'RELIANCE',    label: 'Reliance' },
  'TCS':        { twelveDataSymbol: 'TCS',         label: 'TCS' },
  'HDFCBANK':   { twelveDataSymbol: 'HDFCBANK',    label: 'HDFC Bank' },
  'INFY':       { twelveDataSymbol: 'INFY',        label: 'Infosys' },
};

const VALID_TIMEFRAMES = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '1d', '1w', '1M']);

// Twelve Data interval mapping
const TWELVE_DATA_INTERVAL: Record<string, string> = {
  '1m': '1min',
  '3m': '3min',  // Note: Twelve Data doesn't support 3min, we'll use 5min
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '1d': '1day',
  '1w': '1week',
  '1M': '1month',
};

interface CandleRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchTwelveData(
  symbol: string,
  startDate: string,
  endDate: string,
  tf: string,
  apiKey: string,
): Promise<CandleRow[]> {
  const symbolInfo = ALLOWED_SYMBOLS[symbol];
  if (!symbolInfo) throw new Error(`Symbol ${symbol} is not allowed`);

  let interval = TWELVE_DATA_INTERVAL[tf] || '1day';
  // Twelve Data doesn't support 3min, fallback to 5min
  if (tf === '3m') interval = '5min';

  const isIndex = symbol === 'NIFTY50' || symbol === 'BANKNIFTY';
  const twelveSymbol = symbolInfo.twelveDataSymbol;

  // Build URL with exchange parameter for stocks
  const params = new URLSearchParams({
    symbol: twelveSymbol,
    interval,
    start_date: startDate,
    end_date: endDate,
    apikey: apiKey,
    format: 'JSON',
    outputsize: '5000',
  });

  // Add exchange for stocks (not indices)
  if (!isIndex) {
    params.set('exchange', 'NSE');
  }

  const url = `https://api.twelvedata.com/time_series?${params.toString()}`;

  console.log(`Fetching Twelve Data: ${twelveSymbol}, interval=${interval}, ${startDate} to ${endDate}`);

  const resp = await fetch(url);

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Twelve Data API error [${resp.status}]:`, text);
    throw new Error(`Twelve Data API returned ${resp.status}`);
  }

  const json = await resp.json();

  if (json.status === 'error') {
    console.error('Twelve Data error:', json.message);
    throw new Error(json.message || 'Twelve Data API error');
  }

  const values = json.values;
  if (!values || !Array.isArray(values) || values.length === 0) {
    return [];
  }

  const isIntraday = ['1m', '3m', '5m', '15m', '30m', '1h'].includes(tf);

  const ohlcv: CandleRow[] = [];
  for (const v of values) {
    const open = parseFloat(v.open);
    const high = parseFloat(v.high);
    const low = parseFloat(v.low);
    const close = parseFloat(v.close);
    const volume = parseInt(v.volume) || 0;

    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

    const dateStr = isIntraday ? new Date(v.datetime).toISOString() : v.datetime.split(' ')[0];

    ohlcv.push({
      date: dateStr,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  // Twelve Data returns newest first, reverse to chronological order
  ohlcv.reverse();

  return ohlcv;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, startDate, endDate, timeframe } = await req.json();

    if (!symbol || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'symbol, startDate, and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tf = timeframe || '1d';
    if (!VALID_TIMEFRAMES.has(tf)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid timeframe. Allowed: ${[...VALID_TIMEFRAMES].join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upperSymbol = symbol.toUpperCase();

    // Validate symbol is allowed
    if (!ALLOWED_SYMBOLS[upperSymbol]) {
      return new Response(
        JSON.stringify({ success: false, error: `Symbol "${symbol}" is not available. Allowed: ${Object.keys(ALLOWED_SYMBOLS).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startMs = Date.parse(startDate);
    const endMs = Date.parse(endDate);
    if (isNaN(startMs) || isNaN(endMs)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid date format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isIntraday = ['1m', '3m', '5m', '15m', '30m', '1h'].includes(tf);

    // ── Check cache first ──
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: cachedRows, error: cacheError } = await supabase
      .from("market_data_cache")
      .select("timestamp, open, high, low, close, volume")
      .eq("symbol", upperSymbol)
      .eq("timeframe", tf)
      .gte("timestamp", new Date(startMs).toISOString())
      .lte("timestamp", new Date(endMs + 86400000).toISOString())
      .order("timestamp", { ascending: true })
      .limit(10000);

    if (!cacheError && cachedRows && cachedRows.length > 0) {
      const rangeDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
      const expectedMinCandles = isIntraday
        ? Math.floor(rangeDays * 5)
        : tf === '1w' ? Math.floor(rangeDays / 7 * 0.8)
        : Math.floor(rangeDays * 0.6);

      if (cachedRows.length >= Math.max(expectedMinCandles * 0.8, 5)) {
        console.log(`Cache hit: ${cachedRows.length} candles for ${upperSymbol}/${tf}`);
        const ohlcv: CandleRow[] = cachedRows.map((row: any) => ({
          date: isIntraday ? new Date(row.timestamp).toISOString() : new Date(row.timestamp).toISOString().split('T')[0],
          open: Number(row.open),
          high: Number(row.high),
          low: Number(row.low),
          close: Number(row.close),
          volume: Number(row.volume),
        }));

        return new Response(
          JSON.stringify({ success: true, data: ohlcv, meta: { symbol: upperSymbol, interval: tf, count: ohlcv.length, source: 'cache', exchange: 'NSE' } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Fetch from Twelve Data ──
    const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'TWELVE_DATA_API_KEY is not configured. Please add it in project settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ohlcv = await fetchTwelveData(upperSymbol, startDate, endDate, tf, apiKey);

    if (!ohlcv || ohlcv.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No data returned. The symbol may be invalid or data unavailable for this range/timeframe.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Cache results ──
    const cacheInserts = ohlcv.map(c => ({
      symbol: upperSymbol,
      timeframe: tf,
      timestamp: isIntraday ? c.date : new Date(c.date).toISOString(),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));

    if (cacheInserts.length > 0) {
      for (let i = 0; i < cacheInserts.length; i += 500) {
        const batch = cacheInserts.slice(i, i + 500);
        const { error: insertError } = await supabase
          .from("market_data_cache")
          .upsert(batch, { onConflict: "symbol,timeframe,timestamp", ignoreDuplicates: true });
        if (insertError) console.error("Cache insert error:", insertError.message);
      }
      console.log(`Cached ${cacheInserts.length} candles for ${upperSymbol}/${tf}`);
    }

    console.log(`Returned ${ohlcv.length} candles for ${upperSymbol} from Twelve Data`);

    return new Response(
      JSON.stringify({
        success: true,
        data: ohlcv,
        meta: { symbol: upperSymbol, interval: tf, count: ohlcv.length, currency: 'INR', exchange: 'NSE', source: 'twelve_data' }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Failed to fetch market data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
