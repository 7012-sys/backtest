import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Yahoo Finance symbol mapping for NSE stocks ──
const YAHOO_SYMBOL_MAP: Record<string, string> = {
  // Indices
  'NIFTY50': '^NSEI',
  'BANKNIFTY': '^NSEBANK',
  'NIFTYIT': '^CNXIT',
  'NIFTYMIDCAP': 'NIFTY_MIDCAP_100.NS',
  'NIFTYNEXT50': '^NSMIDCP',
};

// All other NSE equities: append .NS (e.g., RELIANCE -> RELIANCE.NS)

const VALID_TIMEFRAMES = new Set(['1m', '3m', '5m', '15m', '30m', '1h', '1d', '1w', '1M']);

// Yahoo Finance interval mapping
const YAHOO_INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '3m': '5m',   // Yahoo doesn't support 3m, use 5m
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '60m',
  '1d': '1d',
  '1w': '1wk',
  '1M': '1mo',
};

// Yahoo Finance range limits for intraday data
const YAHOO_MAX_RANGE_DAYS: Record<string, number> = {
  '1m': 7,
  '3m': 60,
  '5m': 60,
  '15m': 60,
  '30m': 60,
  '1h': 730,
  '1d': 36500,
  '1w': 36500,
  '1M': 36500,
};

interface CandleRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function getYahooSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (YAHOO_SYMBOL_MAP[upper]) return YAHOO_SYMBOL_MAP[upper];
  // For equities, append .NS if not already present
  if (upper.endsWith('.NS') || upper.endsWith('.BO')) return upper;
  if (upper.startsWith('^')) return upper;
  return `${upper}.NS`;
}

async function fetchYahooHistorical(
  yahooSymbol: string,
  startMs: number,
  endMs: number,
  tf: string,
): Promise<CandleRow[]> {
  const interval = YAHOO_INTERVAL_MAP[tf] || '1d';
  const isIntraday = ['1m', '3m', '5m', '15m', '30m', '1h'].includes(tf);

  // Clamp date range for intraday
  const maxDays = YAHOO_MAX_RANGE_DAYS[tf] || 36500;
  const maxStartMs = endMs - maxDays * 86400000;
  const clampedStartMs = Math.max(startMs, maxStartMs);

  const period1 = Math.floor(clampedStartMs / 1000);
  const period2 = Math.floor(endMs / 1000) + 86400;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false`;

  console.log(`Fetching Yahoo data: ${yahooSymbol}, interval=${interval}, from=${new Date(clampedStartMs).toISOString()} to=${new Date(endMs).toISOString()}`);

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Yahoo API error [${resp.status}]:`, text);
    throw new Error(`Yahoo Finance returned ${resp.status}`);
  }

  const json = await resp.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    return [];
  }

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];
  if (!quote || timestamps.length === 0) {
    return [];
  }

  const ohlcv: CandleRow[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const open = quote.open?.[i];
    const high = quote.high?.[i];
    const low = quote.low?.[i];
    const close = quote.close?.[i];
    const volume = quote.volume?.[i] || 0;

    if (open == null || high == null || low == null || close == null) continue;
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

    const tsDate = new Date(timestamps[i] * 1000);
    const dateStr = isIntraday ? tsDate.toISOString() : tsDate.toISOString().split('T')[0];

    ohlcv.push({
      date: dateStr,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: volume || 0,
    });
  }

  return ohlcv;
}

// ── NSE India Charts API (primary, may fail from cloud) ──
const NSE_HISTORICAL_URL = "https://charting.nseindia.com/v1/charts/symbolHistoricalData";
const NSE_MAIN_URL = "https://www.nseindia.com";

const NSE_SYMBOL_MAP: Record<string, { symbol: string; scripcode: string; symbolType: string; segment: string }> = {
  'NIFTY50':      { symbol: 'NIFTY 50',       scripcode: '26000', symbolType: 'Index',  segment: 'IDX' },
  'BANKNIFTY':    { symbol: 'NIFTY BANK',     scripcode: '26004', symbolType: 'Index',  segment: 'IDX' },
  'NIFTYIT':      { symbol: 'NIFTY IT',       scripcode: '26001', symbolType: 'Index',  segment: 'IDX' },
  'RELIANCE':     { symbol: 'RELIANCE-EQ',    scripcode: '2885',  symbolType: 'Equity', segment: 'EQ' },
  'TCS':          { symbol: 'TCS-EQ',         scripcode: '11536', symbolType: 'Equity', segment: 'EQ' },
  'INFY':         { symbol: 'INFY-EQ',        scripcode: '1594',  symbolType: 'Equity', segment: 'EQ' },
  'HDFCBANK':     { symbol: 'HDFCBANK-EQ',    scripcode: '1333',  symbolType: 'Equity', segment: 'EQ' },
  'ICICIBANK':    { symbol: 'ICICIBANK-EQ',   scripcode: '4963',  symbolType: 'Equity', segment: 'EQ' },
  'SBIN':         { symbol: 'SBIN-EQ',        scripcode: '3045',  symbolType: 'Equity', segment: 'EQ' },
  'ITC':          { symbol: 'ITC-EQ',         scripcode: '1660',  symbolType: 'Equity', segment: 'EQ' },
  'TITAN':        { symbol: 'TITAN-EQ',       scripcode: '3506',  symbolType: 'Equity', segment: 'EQ' },
  'TATAMOTORS':   { symbol: 'TATAMOTORS-EQ',  scripcode: '3456',  symbolType: 'Equity', segment: 'EQ' },
};

const NSE_INTERVAL_MAP: Record<string, { timeInterval: number; chartType: string }> = {
  '1m':  { timeInterval: 1,  chartType: 'I' },
  '5m':  { timeInterval: 5,  chartType: 'I' },
  '15m': { timeInterval: 15, chartType: 'I' },
  '30m': { timeInterval: 30, chartType: 'I' },
  '1h':  { timeInterval: 60, chartType: 'I' },
  '1d':  { timeInterval: 1,  chartType: 'D' },
  '1w':  { timeInterval: 1,  chartType: 'W' },
  '1M':  { timeInterval: 1,  chartType: 'M' },
};

async function tryNSEFetch(symbol: string, startMs: number, endMs: number, tf: string): Promise<CandleRow[] | null> {
  const upperSymbol = symbol.toUpperCase();
  const symbolInfo = NSE_SYMBOL_MAP[upperSymbol];
  if (!symbolInfo) return null;

  const intervalConfig = NSE_INTERVAL_MAP[tf];
  if (!intervalConfig) return null;

  try {
    // Get cookies
    const cookieResp = await fetch(NSE_MAIN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    await cookieResp.text();
    const cookies = cookieResp.headers.get('set-cookie') || '';

    const payload = {
      token: symbolInfo.scripcode,
      fromDate: Math.floor(startMs / 1000),
      toDate: Math.floor(endMs / 1000) + 86400,
      symbol: symbolInfo.symbol,
      symbolType: symbolInfo.symbolType,
      chartType: intervalConfig.chartType,
      timeInterval: intervalConfig.timeInterval,
    };

    const resp = await fetch(NSE_HISTORICAL_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://charting.nseindia.com',
        'Referer': 'https://charting.nseindia.com/',
        'Cookie': cookies,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      await resp.text();
      return null;
    }

    const result = await resp.json();
    if (!result?.status || !result?.data?.length) return null;

    const isIntraday = intervalConfig.chartType === 'I';
    const ohlcv: CandleRow[] = [];

    for (const candle of result.data) {
      if (!Array.isArray(candle) || candle.length < 5) continue;
      const [ts, open, high, low, close, volume = 0] = candle;
      if (open == null || high == null || low == null || close == null) continue;
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

      const tsDate = new Date(typeof ts === 'number' && ts > 1e12 ? ts : ts * 1000);
      const dateStr = isIntraday ? tsDate.toISOString() : tsDate.toISOString().split('T')[0];
      ohlcv.push({
        date: dateStr,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: volume || 0,
      });
    }

    return ohlcv.length > 0 ? ohlcv : null;
  } catch (e) {
    console.warn("NSE fetch failed, will use Yahoo fallback:", (e as Error).message);
    return null;
  }
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

    const startMs = Date.parse(startDate);
    const endMs = Date.parse(endDate);
    if (isNaN(startMs) || isNaN(endMs)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid date format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upperSymbol = symbol.toUpperCase();

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

    const isIntraday = ['1m', '3m', '5m', '15m', '30m', '1h'].includes(tf);

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

    // ── Try NSE first, then Yahoo Finance fallback ──
    let ohlcv: CandleRow[] | null = null;
    let source = 'nse_india';

    ohlcv = await tryNSEFetch(upperSymbol, startMs, endMs, tf);

    if (!ohlcv || ohlcv.length === 0) {
      console.log(`NSE fetch returned no data for ${upperSymbol}, trying Yahoo Finance...`);
      source = 'yahoo_finance';
      const yahooSymbol = getYahooSymbol(upperSymbol);
      ohlcv = await fetchYahooHistorical(yahooSymbol, startMs, endMs, tf);
    }

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

    console.log(`Returned ${ohlcv.length} candles for ${upperSymbol} from ${source}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: ohlcv,
        meta: { symbol: upperSymbol, interval: tf, count: ohlcv.length, currency: 'INR', exchange: 'NSE', source }
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
