// Main Backtest Engine
// Orchestrates the backtesting process

import { 
  OHLCV, 
  StrategyRule, 
  BacktestResults, 
  BacktestConfig,
  EquityPoint,
} from './types';
import { checkEntrySignal, checkExitSignal } from './strategyParser';
import { 
  initializeSimulation, 
  openPosition, 
  closePosition, 
  updateEquityCurve,
  forceClosePosition,
} from './tradeSimulator';
import { calculateMetrics, calculateMonthlyReturns } from './metrics';
import { calculateConfidenceScore } from './confidenceScore';

// Re-export types for convenience
export * from './types';
export * from './indicators';
export * from './strategyParser';
export * from './tradeSimulator';
export * from './metrics';
export * from './optimizer';
export * from './confidenceScore';
export * from './walkForward';

// Default backtest configuration
const DEFAULT_CONFIG: BacktestConfig = {
  initialCapital: 100000,
  positionSizing: 0.95,
  stopLossPercent: 3,
  takeProfitPercent: 5,
  maxHoldingDays: 20,
  allowShorts: false,
};

// Main backtest function
export function runBacktest(
  priceData: OHLCV[],
  entryRules: StrategyRule[],
  exitRules: StrategyRule[],
  initialCapital: number,
  config: Partial<BacktestConfig> = {}
): BacktestResults {
  const fullConfig = { ...DEFAULT_CONFIG, ...config, initialCapital };
  
  // Clamp end date to dataset max date to avoid processing empty/future data
  const datasetMaxDate = priceData.length > 0 ? priceData[priceData.length - 1].date : '';
  const datasetMinDate = priceData.length > 0 ? priceData[0].date : '';
  // Filter priceData to only include data within the dataset bounds
  // (already handled by caller, but defensive)
  
  let state = initializeSimulation(initialCapital);
  
  // Process each candle
  for (let i = 0; i < priceData.length; i++) {
    const candle = priceData[i];
    
    // Update equity curve
    state = updateEquityCurve(state, candle, i + 1);
    
    if (!state.position) {
      // Look for entry signal
      if (checkEntrySignal(priceData, i, entryRules)) {
        state = openPosition(state, candle, i, fullConfig);
      }
    } else {
      // Look for exit signal
      const holdingDays = i - state.position.entryIndex;
      const { shouldExit } = checkExitSignal(
        priceData, 
        i, 
        exitRules, 
        state.position.entryPrice, 
        holdingDays,
        {
          stopLossPercent: fullConfig.stopLossPercent,
          takeProfitPercent: fullConfig.takeProfitPercent,
          maxHoldingDays: fullConfig.maxHoldingDays,
        }
      );
      
      if (shouldExit) {
        state = closePosition(state, candle, priceData, fullConfig);
      }
    }
  }
  
  // Force close any open position at end of backtest
  state = forceClosePosition(state, priceData, fullConfig);
  
  // Calculate performance metrics
  const metrics = calculateMetrics(
    state.trades,
    state.equityCurve,
    initialCapital,
    state.maxDrawdown
  );
  
  // Calculate monthly returns
  const monthlyReturns = calculateMonthlyReturns(state.equityCurve);

  // Calculate confidence score
  const paramCount = entryRules.length + exitRules.length;
  const confidence = calculateConfidenceScore(state.trades, state.equityCurve, paramCount, initialCapital);
  
  return {
    ...metrics,
    sortinoRatio: metrics.sortinoRatio,
    equityCurve: state.equityCurve,
    monthlyReturns,
    finalEquity: Math.round(state.equity),
    trades: state.trades,
    priceData,
    skippedSignals: state.skippedSignals,
    confidenceScore: confidence.overall,
    confidenceBreakdown: confidence,
  };
}

// Seeded PRNG (mulberry32) — guarantees same inputs → same output
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Generate realistic price data for a symbol within date range
export function generatePriceData(
  symbol: string,
  startDate: string,
  endDate: string,
  timeframe: string
): OHLCV[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data: OHLCV[] = [];

  // Use seeded PRNG so same inputs always produce same output
  const rand = seededRandom(hashSeed(symbol + startDate + endDate + timeframe));

  let basePrice = getBasePrice(symbol);
  const volatility = getVolatility(symbol);

  const intervalMs = getIntervalMs(timeframe);
  const tradingHoursOnly = ['1m', '5m', '15m', '1h'].includes(timeframe);

  let currentDate = new Date(start);
  let price = basePrice;

  while (currentDate <= end) {
    if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      continue;
    }

    if (tradingHoursOnly) {
      const tradingStart = new Date(currentDate);
      tradingStart.setHours(9, 15, 0, 0);
      const tradingEnd = new Date(currentDate);
      tradingEnd.setHours(15, 30, 0, 0);

      let candleTime = new Date(tradingStart);
      while (candleTime <= tradingEnd && candleTime <= end) {
        const candle = generateCandle(price, volatility, candleTime.toISOString(), rand);
        data.push(candle);
        price = candle.close;
        candleTime = new Date(candleTime.getTime() + intervalMs);
      }
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    } else {
      const candle = generateCandle(price, volatility, currentDate.toISOString().split('T')[0], rand);
      data.push(candle);
      price = candle.close;
      currentDate = new Date(currentDate.getTime() + intervalMs);
    }

    if (data.length >= 10000) break; // Allow up to 10000 candles for multi-year ranges
  }

  return data;
}

function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    'NIFTY50': 22500,
    'BANKNIFTY': 48000,
    'NIFTYIT': 34000,
    'NIFTYMIDCAP': 12000,
    'RELIANCE': 2900,
    'TCS': 4200,
    'INFY': 1800,
    'ICICIBANK': 1100,
    'HINDUNILVR': 2400,
    'SBIN': 780,
    'BHARTIARTL': 1450,
    'ITC': 450,
    'KOTAKBANK': 1750,
    'LT': 3500,
    'AXISBANK': 1200,
    'ASIANPAINT': 2800,
    'MARUTI': 12500,
    'TITAN': 3600,
    'BAJFINANCE': 7200,
    'WIPRO': 520,
    'ULTRACEMCO': 11000,
    'NESTLEIND': 2500,
    'SUNPHARMA': 1800,
  };
  return prices[symbol] || 1000;
}

function getVolatility(symbol: string): number {
  if (['BANKNIFTY'].includes(symbol)) return 0.015;
  if (['NIFTY50', 'NIFTYIT', 'NIFTYMIDCAP'].includes(symbol)) return 0.01;
  return 0.012;
}

function getIntervalMs(timeframe: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  return intervals[timeframe] || 24 * 60 * 60 * 1000;
}

function generateCandle(basePrice: number, volatility: number, date: string, rand: () => number): OHLCV {
  const trend = rand() > 0.48 ? 1 : -1;
  const range = basePrice * volatility;

  const open = basePrice + (rand() - 0.5) * range * 0.3;
  const close = open + trend * rand() * range;
  const high = Math.max(open, close) + rand() * range * 0.5;
  const low = Math.min(open, close) - rand() * range * 0.5;
  const volume = Math.floor(100000 + rand() * 500000);

  return {
    date,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(Math.max(close, low + 0.01) * 100) / 100,
    volume,
  };
}

