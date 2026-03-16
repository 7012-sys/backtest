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

// Map timeframe to Yahoo Finance interval
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '60m',
  '1d': '1d',
  '1w': '1wk',
};

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

    // Validate symbol against allowlist
    if (typeof symbol !== 'string' || !VALID_SYMBOLS.has(symbol)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid symbol. Allowed: ${[...VALID_SYMBOLS].join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate timeframe against allowlist
    const tf = timeframe || '1d';
    if (!VALID_TIMEFRAMES.has(tf)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid timeframe. Allowed: ${[...VALID_TIMEFRAMES].join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date formats
    const startMs = Date.parse(startDate);
    const endMs = Date.parse(endDate);
    if (isNaN(startMs) || isNaN(endMs)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid date format for startDate or endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const yahooSymbol = SYMBOL_MAP[symbol]!;
    const interval = INTERVAL_MAP[tf] || '1d';

    // Convert dates to Unix timestamps
    const period1 = Math.floor(startMs / 1000);
    const period2 = Math.floor(endMs / 1000) + 86400; // Include end date

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false`;

    console.log(`Fetching: ${yahooSymbol}, interval=${interval}, ${startDate} to ${endDate}`);

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

    // Build OHLCV array, skipping null entries
    const ohlcv: Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }> = [];

    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];

      if (open == null || high == null || low == null || close == null) continue;

      const date = new Date(timestamps[i] * 1000);
      const dateStr = interval === '1d' || interval === '1wk'
        ? date.toISOString().split('T')[0]
        : date.toISOString();

      ohlcv.push({
        date: dateStr,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: volume || 0,
      });
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
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching market data:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch market data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
