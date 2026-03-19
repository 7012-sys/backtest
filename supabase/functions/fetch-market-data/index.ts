import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map internal symbols to Yahoo Finance tickers
const SYMBOL_MAP: Record<string, string> = {
  'NIFTY50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'NIFTYIT': '^CNXIT',
  'NIFTYMIDCAP': 'NIFTY_MIDCAP_100.NS',
  'RELIANCE': 'RELIANCE.NS',
  'TCS': 'TCS.NS',
  'INFY': 'INFY.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'HINDUNILVR': 'HINDUNILVR.NS',
  'SBIN': 'SBIN.NS',
  'BHARTIARTL': 'BHARTIARTL.NS',
  'ITC': 'ITC.NS',
  'KOTAKBANK': 'KOTAKBANK.NS',
  'LT': 'LT.NS',
  'AXISBANK': 'AXISBANK.NS',
  'ASIANPAINT': 'ASIANPAINT.NS',
  'MARUTI': 'MARUTI.NS',
  'TITAN': 'TITAN.NS',
  'BAJFINANCE': 'BAJFINANCE.NS',
  'WIPRO': 'WIPRO.NS',
  'ULTRACEMCO': 'ULTRACEMCO.NS',
  'NESTLEIND': 'NESTLEIND.NS',
  'SUNPHARMA': 'SUNPHARMA.NS',
};

const VALID_SYMBOLS = new Set(Object.keys(SYMBOL_MAP));
const VALID_TIMEFRAMES = new Set(['1m', '5m', '15m', '1h', '1d', '1w']);

const INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '60m',
  '1d': '1d',
  '1w': '1wk',
};

// Intraday date range limits (in days)
const INTRADAY_LIMITS: Record<string, number> = {
  '1m': 7,
  '5m': 60,
  '15m': 60,
  '1h': 730,
};

interface CandleRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, startDate, endDate, timeframe } = await req.json();

    // Validate required fields
    if (!symbol || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ success: false, error: 'symbol, startDate, and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate symbol
    if (typeof symbol !== 'string' || !VALID_SYMBOLS.has(symbol)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid symbol. Allowed: ${[...VALID_SYMBOLS].join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate timeframe
    const tf = timeframe || '1d';
    if (!VALID_TIMEFRAMES.has(tf)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid timeframe. Allowed: ${[...VALID_TIMEFRAMES].join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate dates
    const startMs = Date.parse(startDate);
    const endMs = Date.parse(endDate);
    if (isNaN(startMs) || isNaN(endMs)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid date format for startDate or endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Enforce intraday date range limits ──
    const maxDays = INTRADAY_LIMITS[tf];
    if (maxDays) {
      const rangeDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
      if (rangeDays > maxDays) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `${tf} timeframe is limited to ${maxDays} days of data. You selected ${rangeDays} days. Please reduce your date range.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Initialize Supabase client (service role for cache writes) ──
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Step 1: Check Supabase cache first ──
    const { data: cachedRows, error: cacheError } = await supabase
      .from("market_data_cache")
      .select("timestamp, open, high, low, close, volume")
      .eq("symbol", symbol)
      .eq("timeframe", tf)
      .gte("timestamp", new Date(startMs).toISOString())
      .lte("timestamp", new Date(endMs + 86400000).toISOString())
      .order("timestamp", { ascending: true });

    if (!cacheError && cachedRows && cachedRows.length > 0) {
      // Determine if cache has sufficient data
      // For daily data, expect roughly 1 candle per trading day (~70% of calendar days)
      const rangeDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
      const expectedMinCandles = tf === '1d' ? Math.floor(rangeDays * 0.6) :
                                  tf === '1w' ? Math.floor(rangeDays / 7 * 0.8) :
                                  Math.floor(rangeDays * 5); // rough estimate for intraday

      if (cachedRows.length >= Math.max(expectedMinCandles * 0.8, 5)) {
        console.log(`Cache hit: ${cachedRows.length} candles for ${symbol}/${tf}`);
        const ohlcv: CandleRow[] = cachedRows.map((row: any) => {
          const date = new Date(row.timestamp);
          const dateStr = (tf === '1d' || tf === '1w' || tf === '1wk')
            ? date.toISOString().split('T')[0]
            : date.toISOString();
          return {
            date: dateStr,
            open: Number(row.open),
            high: Number(row.high),
            low: Number(row.low),
            close: Number(row.close),
            volume: Number(row.volume),
          };
        });

        return new Response(
          JSON.stringify({
            success: true,
            data: ohlcv,
            meta: { symbol, interval: tf, count: ohlcv.length, source: 'cache' }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Step 2: Fetch from Yahoo Finance ──
    const yahooSymbol = SYMBOL_MAP[symbol]!;
    const interval = INTERVAL_MAP[tf] || '1d';
    const period1 = Math.floor(startMs / 1000);
    const period2 = Math.floor(endMs / 1000) + 86400;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false`;
    console.log(`Cache miss. Fetching from Yahoo: ${yahooSymbol}, interval=${interval}, ${startDate} to ${endDate}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Yahoo Finance error [${response.status}]:`, text);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Market data provider returned ${response.status}. This may be due to rate limits or an invalid symbol.`
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result || !result.timestamp || result.timestamp.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No data returned. The symbol may be invalid or data unavailable for this range/timeframe.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamps = result.timestamp;
    const quote = result.indicators?.quote?.[0];

    if (!quote) {
      return new Response(
        JSON.stringify({ success: false, error: 'No quote data in response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 3: Build OHLCV array, validate data (skip null candles) ──
    const ohlcv: CandleRow[] = [];
    const cacheInserts: any[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];

      // Data validation: skip rows with any null OHLC
      if (open == null || high == null || low == null || close == null) continue;
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

      const tsDate = new Date(timestamps[i] * 1000);
      const dateStr = (interval === '1d' || interval === '1wk')
        ? tsDate.toISOString().split('T')[0]
        : tsDate.toISOString();

      const roundedOpen = Math.round(open * 100) / 100;
      const roundedHigh = Math.round(high * 100) / 100;
      const roundedLow = Math.round(low * 100) / 100;
      const roundedClose = Math.round(close * 100) / 100;
      const roundedVolume = volume || 0;

      ohlcv.push({
        date: dateStr,
        open: roundedOpen,
        high: roundedHigh,
        low: roundedLow,
        close: roundedClose,
        volume: roundedVolume,
      });

      cacheInserts.push({
        symbol,
        timeframe: tf,
        timestamp: tsDate.toISOString(),
        open: roundedOpen,
        high: roundedHigh,
        low: roundedLow,
        close: roundedClose,
        volume: roundedVolume,
      });
    }

    // ── Step 4: Store fetched candles in Supabase cache (upsert) ──
    if (cacheInserts.length > 0) {
      // Insert in batches of 500
      for (let i = 0; i < cacheInserts.length; i += 500) {
        const batch = cacheInserts.slice(i, i + 500);
        const { error: insertError } = await supabase
          .from("market_data_cache")
          .upsert(batch, { onConflict: "symbol,timeframe,timestamp", ignoreDuplicates: true });

        if (insertError) {
          console.error("Cache insert error (non-fatal):", insertError.message);
        }
      }
      console.log(`Cached ${cacheInserts.length} candles for ${symbol}/${tf}`);
    }

    console.log(`Returned ${ohlcv.length} candles for ${yahooSymbol}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: ohlcv,
        meta: {
          symbol: yahooSymbol,
          interval,
          count: ohlcv.length,
          currency: result.meta?.currency || 'INR',
          exchangeName: result.meta?.exchangeName || 'NSE',
          source: 'yahoo',
        }
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
