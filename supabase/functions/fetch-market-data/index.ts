import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── NSE India Charts API endpoints ──
const NSE_SEARCH_URL = "https://charting.nseindia.com/v1/exchanges/symbolsDynamic";
const NSE_HISTORICAL_URL = "https://charting.nseindia.com/v1/charts/symbolHistoricalData";
const NSE_MAIN_URL = "https://www.nseindia.com";

// ── NSE Symbol Map: internal name → { symbol, scripcode, type, segment } ──
// Scripcode (token) values sourced from NSE charting API
const NSE_SYMBOL_MAP: Record<string, { symbol: string; scripcode: string; symbolType: string; segment: string }> = {
  // Indices
  'NIFTY50':      { symbol: 'NIFTY 50',       scripcode: '26000', symbolType: 'Index',  segment: 'IDX' },
  'BANKNIFTY':    { symbol: 'NIFTY BANK',     scripcode: '26004', symbolType: 'Index',  segment: 'IDX' },
  'NIFTYIT':      { symbol: 'NIFTY IT',       scripcode: '26001', symbolType: 'Index',  segment: 'IDX' },
  'NIFTYMIDCAP':  { symbol: 'NIFTY MIDCAP 100', scripcode: '26005', symbolType: 'Index', segment: 'IDX' },
  'NIFTYNEXT50':  { symbol: 'NIFTY NEXT 50',  scripcode: '26002', symbolType: 'Index',  segment: 'IDX' },
  // Equities (will be resolved dynamically if not in this list)
  'RELIANCE':     { symbol: 'RELIANCE-EQ',    scripcode: '2885',  symbolType: 'Equity', segment: 'EQ' },
  'TCS':          { symbol: 'TCS-EQ',         scripcode: '11536', symbolType: 'Equity', segment: 'EQ' },
  'INFY':         { symbol: 'INFY-EQ',        scripcode: '1594',  symbolType: 'Equity', segment: 'EQ' },
  'ICICIBANK':    { symbol: 'ICICIBANK-EQ',   scripcode: '4963',  symbolType: 'Equity', segment: 'EQ' },
  'HINDUNILVR':   { symbol: 'HINDUNILVR-EQ',  scripcode: '1394',  symbolType: 'Equity', segment: 'EQ' },
  'SBIN':         { symbol: 'SBIN-EQ',        scripcode: '3045',  symbolType: 'Equity', segment: 'EQ' },
  'BHARTIARTL':   { symbol: 'BHARTIARTL-EQ',  scripcode: '10604', symbolType: 'Equity', segment: 'EQ' },
  'ITC':          { symbol: 'ITC-EQ',         scripcode: '1660',  symbolType: 'Equity', segment: 'EQ' },
  'KOTAKBANK':    { symbol: 'KOTAKBANK-EQ',   scripcode: '1922',  symbolType: 'Equity', segment: 'EQ' },
  'LT':           { symbol: 'LT-EQ',          scripcode: '11483', symbolType: 'Equity', segment: 'EQ' },
  'AXISBANK':     { symbol: 'AXISBANK-EQ',    scripcode: '5900',  symbolType: 'Equity', segment: 'EQ' },
  'ASIANPAINT':   { symbol: 'ASIANPAINT-EQ',  scripcode: '236',   symbolType: 'Equity', segment: 'EQ' },
  'MARUTI':       { symbol: 'MARUTI-EQ',      scripcode: '10999', symbolType: 'Equity', segment: 'EQ' },
  'TITAN':        { symbol: 'TITAN-EQ',       scripcode: '3506',  symbolType: 'Equity', segment: 'EQ' },
  'BAJFINANCE':   { symbol: 'BAJFINANCE-EQ',  scripcode: '16675', symbolType: 'Equity', segment: 'EQ' },
  'WIPRO':        { symbol: 'WIPRO-EQ',       scripcode: '3787',  symbolType: 'Equity', segment: 'EQ' },
  'ULTRACEMCO':   { symbol: 'ULTRACEMCO-EQ',  scripcode: '11532', symbolType: 'Equity', segment: 'EQ' },
  'NESTLEIND':    { symbol: 'NESTLEIND-EQ',   scripcode: '17963', symbolType: 'Equity', segment: 'EQ' },
  'SUNPHARMA':    { symbol: 'SUNPHARMA-EQ',   scripcode: '3351',  symbolType: 'Equity', segment: 'EQ' },
  'HDFCBANK':     { symbol: 'HDFCBANK-EQ',    scripcode: '1333',  symbolType: 'Equity', segment: 'EQ' },
  'TATAMOTORS':   { symbol: 'TATAMOTORS-EQ',  scripcode: '3456',  symbolType: 'Equity', segment: 'EQ' },
  'TATASTEEL':    { symbol: 'TATASTEEL-EQ',   scripcode: '3499',  symbolType: 'Equity', segment: 'EQ' },
  'HCLTECH':      { symbol: 'HCLTECH-EQ',     scripcode: '7229',  symbolType: 'Equity', segment: 'EQ' },
  'POWERGRID':    { symbol: 'POWERGRID-EQ',   scripcode: '14977', symbolType: 'Equity', segment: 'EQ' },
  'NTPC':         { symbol: 'NTPC-EQ',        scripcode: '11630', symbolType: 'Equity', segment: 'EQ' },
  'ONGC':         { symbol: 'ONGC-EQ',        scripcode: '2475',  symbolType: 'Equity', segment: 'EQ' },
  'COALINDIA':    { symbol: 'COALINDIA-EQ',   scripcode: '20374', symbolType: 'Equity', segment: 'EQ' },
  'ADANIENT':     { symbol: 'ADANIENT-EQ',    scripcode: '25',    symbolType: 'Equity', segment: 'EQ' },
  'ADANIPORTS':   { symbol: 'ADANIPORTS-EQ',  scripcode: '15083', symbolType: 'Equity', segment: 'EQ' },
  'DRREDDY':      { symbol: 'DRREDDY-EQ',     scripcode: '881',   symbolType: 'Equity', segment: 'EQ' },
  'CIPLA':        { symbol: 'CIPLA-EQ',       scripcode: '694',   symbolType: 'Equity', segment: 'EQ' },
  'TECHM':        { symbol: 'TECHM-EQ',       scripcode: '13538', symbolType: 'Equity', segment: 'EQ' },
  'BAJAJFINSV':   { symbol: 'BAJAJFINSV-EQ',  scripcode: '16669', symbolType: 'Equity', segment: 'EQ' },
  'EICHERMOT':    { symbol: 'EICHERMOT-EQ',   scripcode: '910',   symbolType: 'Equity', segment: 'EQ' },
  'DIVISLAB':     { symbol: 'DIVISLAB-EQ',    scripcode: '10940', symbolType: 'Equity', segment: 'EQ' },
  'APOLLOHOSP':   { symbol: 'APOLLOHOSP-EQ', scripcode: '157',   symbolType: 'Equity', segment: 'EQ' },
  'JSWSTEEL':     { symbol: 'JSWSTEEL-EQ',    scripcode: '11723', symbolType: 'Equity', segment: 'EQ' },
  'TATACONSUM':   { symbol: 'TATACONSUM-EQ',  scripcode: '3432',  symbolType: 'Equity', segment: 'EQ' },
  'GRASIM':       { symbol: 'GRASIM-EQ',      scripcode: '1232',  symbolType: 'Equity', segment: 'EQ' },
  'HINDALCO':     { symbol: 'HINDALCO-EQ',    scripcode: '1363',  symbolType: 'Equity', segment: 'EQ' },
  'M&M':          { symbol: 'M&M-EQ',         scripcode: '2031',  symbolType: 'Equity', segment: 'EQ' },
  'BPCL':         { symbol: 'BPCL-EQ',        scripcode: '526',   symbolType: 'Equity', segment: 'EQ' },
  'HEROMOTOCO':   { symbol: 'HEROMOTOCO-EQ',  scripcode: '1348',  symbolType: 'Equity', segment: 'EQ' },
  'INDUSINDBK':   { symbol: 'INDUSINDBK-EQ',  scripcode: '5258',  symbolType: 'Equity', segment: 'EQ' },
  'SBILIFE':      { symbol: 'SBILIFE-EQ',     scripcode: '21808', symbolType: 'Equity', segment: 'EQ' },
  'HDFCLIFE':     { symbol: 'HDFCLIFE-EQ',    scripcode: '467',   symbolType: 'Equity', segment: 'EQ' },
  'BRITANNIA':    { symbol: 'BRITANNIA-EQ',   scripcode: '547',   symbolType: 'Equity', segment: 'EQ' },
};

const VALID_SYMBOLS = new Set(Object.keys(NSE_SYMBOL_MAP));
const VALID_TIMEFRAMES = new Set(['1m', '3m', '5m', '10m', '15m', '30m', '1h', '1d', '1w', '1M']);

// NSE interval mapping: chartType I=Intraday, D=Daily, W=Weekly, M=Monthly
const NSE_INTERVAL_MAP: Record<string, { timeInterval: number; chartType: string }> = {
  '1m':  { timeInterval: 1,  chartType: 'I' },
  '3m':  { timeInterval: 3,  chartType: 'I' },
  '5m':  { timeInterval: 5,  chartType: 'I' },
  '10m': { timeInterval: 10, chartType: 'I' },
  '15m': { timeInterval: 15, chartType: 'I' },
  '30m': { timeInterval: 30, chartType: 'I' },
  '1h':  { timeInterval: 60, chartType: 'I' },
  '1d':  { timeInterval: 1,  chartType: 'D' },
  '1w':  { timeInterval: 1,  chartType: 'W' },
  '1M':  { timeInterval: 1,  chartType: 'M' },
};

interface CandleRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── Get NSE cookies for API access ──
async function getNSECookies(): Promise<string> {
  try {
    const resp = await fetch(NSE_MAIN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    await resp.text(); // consume body
    const cookies = resp.headers.get('set-cookie') || '';
    return cookies;
  } catch (e) {
    console.error("Failed to get NSE cookies:", e);
    return '';
  }
}

// ── Dynamic symbol search via NSE API ──
async function searchNSESymbol(symbol: string, segment: string, cookies: string): Promise<{ symbol: string; scripcode: string; symbolType: string } | null> {
  try {
    const resp = await fetch(NSE_SEARCH_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://charting.nseindia.com',
        'Referer': 'https://charting.nseindia.com/',
        'Cookie': cookies,
      },
      body: JSON.stringify({ symbol, segment }),
    });

    if (!resp.ok) {
      await resp.text();
      return null;
    }

    const result = await resp.json();
    if (!result?.status || !result?.data?.length) return null;

    // Find exact match or use first result
    const upperSymbol = symbol.toUpperCase();
    const exact = result.data.find((d: any) => d.symbol?.toUpperCase() === upperSymbol || d.symbol?.toUpperCase() === `${upperSymbol}-EQ`);
    const match = exact || result.data[0];

    return {
      symbol: match.symbol,
      scripcode: String(match.scripcode),
      symbolType: match.type,
    };
  } catch (e) {
    console.error("NSE search error:", e);
    return null;
  }
}

// ── Fetch historical data from NSE Charts API ──
async function fetchNSEHistorical(
  symbolInfo: { symbol: string; scripcode: string; symbolType: string },
  startMs: number,
  endMs: number,
  tf: string,
  cookies: string
): Promise<CandleRow[]> {
  const intervalConfig = NSE_INTERVAL_MAP[tf] || { timeInterval: 1, chartType: 'D' };

  const payload = {
    token: symbolInfo.scripcode,
    fromDate: Math.floor(startMs / 1000),
    toDate: Math.floor(endMs / 1000) + 86400,
    symbol: symbolInfo.symbol,
    symbolType: symbolInfo.symbolType,
    chartType: intervalConfig.chartType,
    timeInterval: intervalConfig.timeInterval,
  };

  console.log(`Fetching NSE data: ${symbolInfo.symbol}, tf=${tf}, from=${new Date(startMs).toISOString()} to=${new Date(endMs).toISOString()}`);

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
    const text = await resp.text();
    console.error(`NSE API error [${resp.status}]:`, text);
    throw new Error(`NSE data provider returned ${resp.status}`);
  }

  const result = await resp.json();

  if (!result?.status || !result?.data || result.data.length === 0) {
    return [];
  }

  // NSE returns data as arrays: [timestamp, open, high, low, close, volume]
  const isIntraday = intervalConfig.chartType === 'I';
  const ohlcv: CandleRow[] = [];

  for (const candle of result.data) {
    // candle format: [timestamp_ms, open, high, low, close, volume]
    if (!Array.isArray(candle) || candle.length < 5) continue;

    const [ts, open, high, low, close, volume = 0] = candle;

    // Skip null/invalid OHLC
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

  return ohlcv;
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

    // ── Resolve symbol info ──
    const upperSymbol = symbol.toUpperCase();
    let symbolInfo = NSE_SYMBOL_MAP[upperSymbol];

    // If not in static map, try dynamic NSE search
    if (!symbolInfo) {
      const cookies = await getNSECookies();
      // Try equity first, then index
      const searchResult = await searchNSESymbol(upperSymbol, 'EQ', cookies)
        || await searchNSESymbol(upperSymbol, 'IDX', cookies);
      
      if (!searchResult) {
        return new Response(
          JSON.stringify({ success: false, error: `Symbol '${symbol}' not found on NSE. Try searching with the exact NSE symbol name.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      symbolInfo = { ...searchResult, segment: searchResult.symbolType === 'Index' ? 'IDX' : 'EQ' };
    }

    // ── Initialize Supabase client for caching ──
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Step 1: Check Supabase cache first ──
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
      const isIntraday = ['1m', '3m', '5m', '10m', '15m', '30m', '1h'].includes(tf);
      const expectedMinCandles = isIntraday
        ? Math.floor(rangeDays * 5) // rough intraday estimate
        : tf === '1w' ? Math.floor(rangeDays / 7 * 0.8)
        : Math.floor(rangeDays * 0.6); // daily

      if (cachedRows.length >= Math.max(expectedMinCandles * 0.8, 5)) {
        console.log(`Cache hit: ${cachedRows.length} candles for ${upperSymbol}/${tf}`);
        const ohlcv: CandleRow[] = cachedRows.map((row: any) => {
          const date = new Date(row.timestamp);
          const dateStr = isIntraday ? date.toISOString() : date.toISOString().split('T')[0];
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
            meta: { symbol: upperSymbol, interval: tf, count: ohlcv.length, source: 'cache', exchange: 'NSE' }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── Step 2: Fetch from NSE India Charts API ──
    const cookies = await getNSECookies();
    const ohlcv = await fetchNSEHistorical(
      { symbol: symbolInfo.symbol, scripcode: symbolInfo.scripcode, symbolType: symbolInfo.symbolType },
      startMs,
      endMs,
      tf,
      cookies
    );

    if (ohlcv.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No data returned from NSE. The symbol may be invalid or data unavailable for this range/timeframe.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 3: Cache fetched candles in Supabase ──
    const isIntraday = ['1m', '3m', '5m', '10m', '15m', '30m', '1h'].includes(tf);
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

        if (insertError) {
          console.error("Cache insert error (non-fatal):", insertError.message);
        }
      }
      console.log(`Cached ${cacheInserts.length} candles for ${upperSymbol}/${tf}`);
    }

    console.log(`Returned ${ohlcv.length} candles for ${symbolInfo.symbol} from NSE`);

    return new Response(
      JSON.stringify({
        success: true,
        data: ohlcv,
        meta: {
          symbol: upperSymbol,
          interval: tf,
          count: ohlcv.length,
          currency: 'INR',
          exchange: 'NSE',
          source: 'nse_india',
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
