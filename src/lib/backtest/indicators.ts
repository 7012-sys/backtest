// Technical Indicators Module
// Contains all indicator calculations for backtesting

import { OHLCV, MACDResult, BollingerBandsResult, StochasticResult, ParabolicSARResult } from './types';

// Simple Moving Average
export function calculateSMA(data: OHLCV[], period: number, index: number): number {
  if (index < period - 1) return data[index].close;
  let sum = 0;
  for (let i = index - period + 1; i <= index; i++) {
    sum += data[i].close;
  }
  return sum / period;
}

// Exponential Moving Average
export function calculateEMA(data: OHLCV[], period: number, index: number): number {
  if (index < period - 1) return data[index].close;
  
  const multiplier = 2 / (period + 1);
  let ema = data[index - period + 1].close;
  
  for (let i = index - period + 2; i <= index; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
  }
  
  return ema;
}

// Relative Strength Index
export function calculateRSI(data: OHLCV[], period: number, index: number): number {
  if (index < period) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = index - period + 1; i <= index; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// MACD (PRO)
export function calculateMACD(data: OHLCV[], index: number, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDResult {
  const emaFast = calculateEMA(data, fastPeriod, index);
  const emaSlow = calculateEMA(data, slowPeriod, index);
  const macd = emaFast - emaSlow;
  
  // Calculate signal line as SMA of recent MACD values (proper implementation)
  let signalSum = 0;
  const signalCount = Math.min(signalPeriod, index + 1);
  for (let j = index - signalCount + 1; j <= index; j++) {
    if (j < 0) continue;
    const ef = calculateEMA(data, fastPeriod, j);
    const es = calculateEMA(data, slowPeriod, j);
    signalSum += (ef - es);
  }
  const signal = signalSum / signalCount;
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

// Bollinger Bands (PRO)
export function calculateBollingerBands(data: OHLCV[], period: number, index: number, stdDevMultiplier = 2): BollingerBandsResult {
  const sma = calculateSMA(data, period, index);
  
  if (index < period - 1) {
    return { upper: sma * 1.02, middle: sma, lower: sma * 0.98 };
  }
  
  let sumSq = 0;
  for (let i = index - period + 1; i <= index; i++) {
    sumSq += Math.pow(data[i].close - sma, 2);
  }
  const stdDev = Math.sqrt(sumSq / period);
  
  return {
    upper: sma + stdDevMultiplier * stdDev,
    middle: sma,
    lower: sma - stdDevMultiplier * stdDev,
  };
}

// Average True Range (PRO)
export function calculateATR(data: OHLCV[], period: number, index: number): number {
  if (index < 1) return data[index].high - data[index].low;
  
  const startIdx = Math.max(1, index - period + 1);
  let atrSum = 0;
  let count = 0;
  
  for (let i = startIdx; i <= index; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    atrSum += tr;
    count++;
  }
  
  return atrSum / count;
}

// Stochastic Oscillator (PRO)
export function calculateStochastic(data: OHLCV[], kPeriod: number, dPeriod: number, index: number): StochasticResult {
  if (index < kPeriod - 1) return { k: 50, d: 50 };
  
  const startIdx = index - kPeriod + 1;
  let highestHigh = -Infinity;
  let lowestLow = Infinity;
  
  for (let i = startIdx; i <= index; i++) {
    highestHigh = Math.max(highestHigh, data[i].high);
    lowestLow = Math.min(lowestLow, data[i].low);
  }
  
  const range = highestHigh - lowestLow;
  const k = range === 0 ? 50 : ((data[index].close - lowestLow) / range) * 100;
  
  // Simplified D calculation
  const d = k; // Would normally be SMA of K values
  
  return { k, d };
}

// Average Directional Index (PRO)
export function calculateADX(data: OHLCV[], period: number, index: number): number {
  if (index < period + 1) return 25; // Neutral value
  
  let plusDMSum = 0;
  let minusDMSum = 0;
  let trSum = 0;
  
  for (let i = index - period + 1; i <= index; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevHigh = data[i - 1].high;
    const prevLow = data[i - 1].low;
    const prevClose = data[i - 1].close;
    
    const plusDM = Math.max(0, high - prevHigh);
    const minusDM = Math.max(0, prevLow - low);
    
    if (plusDM > minusDM) {
      plusDMSum += plusDM;
    } else if (minusDM > plusDM) {
      minusDMSum += minusDM;
    }
    
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
  }
  
  if (trSum === 0) return 25;
  
  const plusDI = (plusDMSum / trSum) * 100;
  const minusDI = (minusDMSum / trSum) * 100;
  const diSum = plusDI + minusDI;
  
  if (diSum === 0) return 25;
  
  const dx = (Math.abs(plusDI - minusDI) / diSum) * 100;
  return dx;
}

// Parabolic SAR (PRO)
export function calculateParabolicSAR(data: OHLCV[], index: number, step = 0.02, maxStep = 0.2): ParabolicSARResult {
  if (index < 2) {
    return { sar: data[index].low, trend: 'bullish' };
  }
  
  // Simplified implementation
  const prevHigh = data[index - 1].high;
  const prevLow = data[index - 1].low;
  const currentClose = data[index].close;
  
  // Determine trend based on price movement
  const trend = currentClose > (prevHigh + prevLow) / 2 ? 'bullish' : 'bearish';
  
  // Calculate SAR
  const sar = trend === 'bullish' 
    ? prevLow - (prevHigh - prevLow) * step
    : prevHigh + (prevHigh - prevLow) * step;
  
  return { sar, trend };
}

// On-Balance Volume (PRO)
export function calculateOBV(data: OHLCV[], index: number): number {
  if (index === 0) return data[0].volume;
  
  let obv = 0;
  for (let i = 1; i <= index; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume;
    }
    // If equal, OBV stays the same
  }
  
  return obv;
}

// Volume Weighted Average Price (PRO)
export function calculateVWAP(data: OHLCV[], index: number): number {
  let sumPV = 0; // Price * Volume
  let sumV = 0;  // Volume
  
  for (let i = 0; i <= index; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    sumPV += typicalPrice * data[i].volume;
    sumV += data[i].volume;
  }
  
  return sumV === 0 ? data[index].close : sumPV / sumV;
}

// Commodity Channel Index (PRO)
export function calculateCCI(data: OHLCV[], period: number, index: number): number {
  if (index < period - 1) return 0;
  
  // Calculate typical prices
  const typicalPrices: number[] = [];
  for (let i = index - period + 1; i <= index; i++) {
    typicalPrices.push((data[i].high + data[i].low + data[i].close) / 3);
  }
  
  // Calculate SMA of typical prices
  const smaTP = typicalPrices.reduce((a, b) => a + b, 0) / period;
  
  // Calculate mean deviation
  const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - smaTP), 0) / period;
  
  if (meanDeviation === 0) return 0;
  
  const currentTP = typicalPrices[typicalPrices.length - 1];
  return (currentTP - smaTP) / (0.015 * meanDeviation);
}

// Money Flow Index (PRO)
export function calculateMFI(data: OHLCV[], period: number, index: number): number {
  if (index < period) return 50;
  
  let positiveFlow = 0;
  let negativeFlow = 0;
  
  for (let i = index - period + 1; i <= index; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    const prevTypicalPrice = (data[i - 1].high + data[i - 1].low + data[i - 1].close) / 3;
    const rawMoneyFlow = typicalPrice * data[i].volume;
    
    if (typicalPrice > prevTypicalPrice) {
      positiveFlow += rawMoneyFlow;
    } else if (typicalPrice < prevTypicalPrice) {
      negativeFlow += rawMoneyFlow;
    }
  }
  
  if (negativeFlow === 0) return 100;
  
  const moneyRatio = positiveFlow / negativeFlow;
  return 100 - (100 / (1 + moneyRatio));
}

// Williams %R (PRO)
export function calculateWilliamsR(data: OHLCV[], period: number, index: number): number {
  if (index < period - 1) return -50;
  
  let highestHigh = -Infinity;
  let lowestLow = Infinity;
  
  for (let i = index - period + 1; i <= index; i++) {
    highestHigh = Math.max(highestHigh, data[i].high);
    lowestLow = Math.min(lowestLow, data[i].low);
  }
  
  const range = highestHigh - lowestLow;
  if (range === 0) return -50;
  
  return ((highestHigh - data[index].close) / range) * -100;
}

// Rate of Change (PRO)
export function calculateROC(data: OHLCV[], period: number, index: number): number {
  if (index < period) return 0;
  
  const prevPrice = data[index - period].close;
  if (prevPrice === 0) return 0;
  
  return ((data[index].close - prevPrice) / prevPrice) * 100;
}

// ─── Candlestick Pattern Detectors ──────────────────────────────────────────
// Return 1 if pattern detected, 0 otherwise

export function detectBullishEngulfing(data: OHLCV[], index: number): number {
  if (index < 1) return 0;
  const prev = data[index - 1];
  const curr = data[index];
  // Previous candle bearish, current candle bullish and engulfs previous body
  return (prev.close < prev.open && curr.close > curr.open &&
    curr.open <= prev.close && curr.close >= prev.open) ? 1 : 0;
}

export function detectBearishEngulfing(data: OHLCV[], index: number): number {
  if (index < 1) return 0;
  const prev = data[index - 1];
  const curr = data[index];
  return (prev.close > prev.open && curr.close < curr.open &&
    curr.open >= prev.close && curr.close <= prev.open) ? 1 : 0;
}

export function detectHammer(data: OHLCV[], index: number): number {
  const c = data[index];
  const body = Math.abs(c.close - c.open);
  const lowerShadow = Math.min(c.open, c.close) - c.low;
  const upperShadow = c.high - Math.max(c.open, c.close);
  const range = c.high - c.low;
  if (range === 0) return 0;
  // Hammer: small body at top, long lower shadow (≥2x body), small upper shadow
  return (lowerShadow >= 2 * body && upperShadow < body * 0.5 && body / range < 0.4) ? 1 : 0;
}

export function detectShootingStar(data: OHLCV[], index: number): number {
  const c = data[index];
  const body = Math.abs(c.close - c.open);
  const lowerShadow = Math.min(c.open, c.close) - c.low;
  const upperShadow = c.high - Math.max(c.open, c.close);
  const range = c.high - c.low;
  if (range === 0) return 0;
  return (upperShadow >= 2 * body && lowerShadow < body * 0.5 && body / range < 0.4) ? 1 : 0;
}

export function detectMorningStar(data: OHLCV[], index: number): number {
  if (index < 2) return 0;
  const first = data[index - 2];
  const second = data[index - 1];
  const third = data[index];
  const secondBody = Math.abs(second.close - second.open);
  const firstBody = Math.abs(first.close - first.open);
  // First: bearish, Second: small body (star), Third: bullish closing above first midpoint
  return (first.close < first.open && secondBody < firstBody * 0.3 &&
    third.close > third.open && third.close > (first.open + first.close) / 2) ? 1 : 0;
}

export function detectDoji(data: OHLCV[], index: number): number {
  const c = data[index];
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  if (range === 0) return 0;
  return (body / range < 0.1) ? 1 : 0;
}

export function detectInsideBar(data: OHLCV[], index: number): number {
  if (index < 1) return 0;
  const prev = data[index - 1];
  const curr = data[index];
  return (curr.high <= prev.high && curr.low >= prev.low) ? 1 : 0;
}

// ─── Breakout Indicators ─────────────────────────────────────────────────────

// N-day highest high
export function calculateHighestHigh(data: OHLCV[], period: number, index: number): number {
  const start = Math.max(0, index - period + 1);
  let highest = -Infinity;
  for (let i = start; i <= index; i++) {
    highest = Math.max(highest, data[i].high);
  }
  return highest;
}

// N-day lowest low
export function calculateLowestLow(data: OHLCV[], period: number, index: number): number {
  const start = Math.max(0, index - period + 1);
  let lowest = Infinity;
  for (let i = start; i <= index; i++) {
    lowest = Math.min(lowest, data[i].low);
  }
  return lowest;
}

// Volume SMA
export function calculateVolumeSMA(data: OHLCV[], period: number, index: number): number {
  const start = Math.max(0, index - period + 1);
  let sum = 0;
  let count = 0;
  for (let i = start; i <= index; i++) {
    sum += data[i].volume;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

// Bollinger Band Width (squeeze detection) — lower = tighter squeeze
export function calculateBBWidth(data: OHLCV[], period: number, index: number): number {
  const bb = calculateBollingerBands(data, period, index);
  if (bb.middle === 0) return 0;
  return ((bb.upper - bb.lower) / bb.middle) * 100;
}

// Previous day high/low
export function getPrevDayHigh(data: OHLCV[], index: number): number {
  return index >= 1 ? data[index - 1].high : data[index].high;
}

export function getPrevDayLow(data: OHLCV[], index: number): number {
  return index >= 1 ? data[index - 1].low : data[index].low;
}

// Opening Range High/Low — uses first candle as the "opening range"
// For daily data, this is the open/high/low of the current candle
// For intraday, ideally this would be the first N-minute candle (approximated here)
export function getOpeningRangeHigh(data: OHLCV[], index: number): number {
  // Use the previous candle's high as opening range reference (first candle of session)
  return index >= 1 ? data[index - 1].high : data[index].high;
}

export function getOpeningRangeLow(data: OHLCV[], index: number): number {
  return index >= 1 ? data[index - 1].low : data[index].low;
}

// Day High/Low — running high/low of current candle
export function getDayHigh(data: OHLCV[], index: number): number {
  return data[index].high;
}

export function getDayLow(data: OHLCV[], index: number): number {
  return data[index].low;
}

// ─── Support & Resistance (Pivot-based) ──────────────────────────────────────

/**
 * Support Level — finds the most recent swing low (a candle whose low is lower
 * than the low of the candles on both sides, looking back over `lookback` bars).
 * Falls back to the lowest low of the lookback period if no pivot is found.
 */
export function calculateSupportLevel(data: OHLCV[], index: number, lookback = 20): number {
  const start = Math.max(2, index - lookback);
  let support = Infinity;
  let found = false;

  for (let i = index - 1; i >= start; i--) {
    // A swing low: low[i] < low[i-1] AND low[i] < low[i+1]
    if (i - 1 >= 0 && i + 1 <= index) {
      if (data[i].low < data[i - 1].low && data[i].low < data[i + 1].low) {
        if (data[i].low < data[index].close) {
          support = Math.min(support, data[i].low);
          found = true;
        }
      }
    }
  }

  // Fallback: lowest low of lookback
  if (!found) {
    for (let i = start; i < index; i++) {
      support = Math.min(support, data[i].low);
    }
  }
  return support;
}

/**
 * Resistance Level — finds the most recent swing high (a candle whose high is
 * higher than the highs on both sides, looking back over `lookback` bars).
 * Falls back to the highest high of the lookback period if no pivot is found.
 */
export function calculateResistanceLevel(data: OHLCV[], index: number, lookback = 20): number {
  const start = Math.max(2, index - lookback);
  let resistance = -Infinity;
  let found = false;

  for (let i = index - 1; i >= start; i--) {
    if (i - 1 >= 0 && i + 1 <= index) {
      if (data[i].high > data[i - 1].high && data[i].high > data[i + 1].high) {
        if (data[i].high > data[index].close) {
          resistance = Math.max(resistance, data[i].high);
          found = true;
        }
      }
    }
  }

  if (!found) {
    for (let i = start; i < index; i++) {
      resistance = Math.max(resistance, data[i].high);
    }
  }
  return resistance;
}

// Gap Up / Gap Down detection (returns 1 or 0)
export function detectGapUp(data: OHLCV[], index: number): number {
  if (index < 1) return 0;
  // Gap up: current open > previous high
  return data[index].open > data[index - 1].high ? 1 : 0;
}

export function detectGapDown(data: OHLCV[], index: number): number {
  if (index < 1) return 0;
  // Gap down: current open < previous low
  return data[index].open < data[index - 1].low ? 1 : 0;
}

// Get indicator value by name
export function getIndicatorValue(
  data: OHLCV[],
  indicator: string,
  index: number
): number {
  // Safety: ensure indicator is a string
  const ind = (typeof indicator === 'string' ? indicator : String(indicator ?? 'price')).toLowerCase().trim();
  
  // Check for dynamic period-based indicators (e.g., sma_50, ema_200, rsi_7)
  const smaMatch = ind.match(/^sma_(\d+)$/);
  if (smaMatch) return calculateSMA(data, parseInt(smaMatch[1]), index);
  
  const emaMatch = ind.match(/^ema_(\d+)$/);
  if (emaMatch) return calculateEMA(data, parseInt(emaMatch[1]), index);
  
  const rsiMatch = ind.match(/^rsi_(\d+)$/);
  if (rsiMatch) return calculateRSI(data, parseInt(rsiMatch[1]), index);

  switch (ind) {
    case 'price':
    case 'close':
      return data[index].close;
    case 'open':
      return data[index].open;
    case 'high':
      return data[index].high;
    case 'low':
      return data[index].low;
    case 'volume':
      return data[index].volume;
    
    // SMA defaults
    case 'sma':
      return calculateSMA(data, 20, index);
    
    // EMA defaults
    case 'ema':
      return calculateEMA(data, 20, index);
    
    // RSI
    case 'rsi':
      return calculateRSI(data, 14, index);
    
    // MACD (PRO)
    case 'macd':
      return calculateMACD(data, index).macd;
    case 'macd_signal':
    case 'macd signal':
    case 'macd_signal_line':
      return calculateMACD(data, index).signal;
    case 'macd_histogram':
      return calculateMACD(data, index).histogram;
    
    // Bollinger Bands (PRO)
    case 'bollinger_upper':
    case 'bollinger upper':
    case 'bb_upper':
      return calculateBollingerBands(data, 20, index).upper;
    case 'bollinger_middle':
    case 'bollinger middle':
    case 'bb_middle':
      return calculateBollingerBands(data, 20, index).middle;
    case 'bollinger_lower':
    case 'bollinger lower':
    case 'bb_lower':
      return calculateBollingerBands(data, 20, index).lower;
    
    // ATR (PRO)
    case 'atr_14':
    case 'atr':
      return calculateATR(data, 14, index);
    
    // Stochastic (PRO)
    case 'stochastic_k':
    case 'stochastic k':
      return calculateStochastic(data, 14, 3, index).k;
    case 'stochastic_d':
    case 'stochastic d':
      return calculateStochastic(data, 14, 3, index).d;
    
    // ADX (PRO)
    case 'adx':
      return calculateADX(data, 14, index);
    
    // Parabolic SAR (PRO)
    case 'parabolic_sar':
      return calculateParabolicSAR(data, index).sar;
    
    // OBV (PRO)
    case 'obv':
      return calculateOBV(data, index);
    
    // VWAP (PRO)
    case 'vwap':
      return calculateVWAP(data, index);
    
    // CCI (PRO)
    case 'cci':
      return calculateCCI(data, 20, index);
    
    // MFI (PRO)
    case 'mfi':
      return calculateMFI(data, 14, index);
    
    // Williams %R (PRO)
    case 'williams_r':
    case 'williams %r':
    case 'williamsr':
      return calculateWilliamsR(data, 14, index);
    
    // ROC (PRO)
    case 'roc':
      return calculateROC(data, 12, index);
    
    // ─── Candlestick Patterns (return 1 or 0) ────────────────────────────
    case 'bullish_engulfing':
      return detectBullishEngulfing(data, index);
    case 'bearish_engulfing':
      return detectBearishEngulfing(data, index);
    case 'hammer':
      return detectHammer(data, index);
    case 'shooting_star':
      return detectShootingStar(data, index);
    case 'morning_star':
      return detectMorningStar(data, index);
    case 'doji':
      return detectDoji(data, index);
    case 'inside_bar':
      return detectInsideBar(data, index);

    // ─── Breakout Indicators ─────────────────────────────────────────────
    case 'high_20':
      return calculateHighestHigh(data, 20, index);
    case 'low_20':
      return calculateLowestLow(data, 20, index);
    case 'high_52w':
    case 'high_252':
      return calculateHighestHigh(data, 252, index);
    case 'low_52w':
    case 'low_252':
      return calculateLowestLow(data, 252, index);
    case 'volume_sma_20':
      return calculateVolumeSMA(data, 20, index);
    case 'bb_width':
    case 'bb_squeeze':
      return calculateBBWidth(data, 20, index);
    case 'prev_day_high':
      return getPrevDayHigh(data, index);
    case 'prev_day_low':
      return getPrevDayLow(data, index);

    // ─── Price Action Indicators ─────────────────────────────────────────
    case 'opening_range_high':
    case 'orb_high':
      return getOpeningRangeHigh(data, index);
    case 'opening_range_low':
    case 'orb_low':
      return getOpeningRangeLow(data, index);
    case 'day_high':
      return getDayHigh(data, index);
    case 'day_low':
      return getDayLow(data, index);
    case 'gap_up':
      return detectGapUp(data, index);
    case 'gap_down':
      return detectGapDown(data, index);
    
    default:
      // Try dynamic breakout patterns: high_N, low_N, volume_sma_N
      const highMatch = ind.match(/^high_(\d+)$/);
      if (highMatch) return calculateHighestHigh(data, parseInt(highMatch[1]), index);
      const lowMatch = ind.match(/^low_(\d+)$/);
      if (lowMatch) return calculateLowestLow(data, parseInt(lowMatch[1]), index);
      const volSmaMatch = ind.match(/^volume_sma_(\d+)$/);
      if (volSmaMatch) return calculateVolumeSMA(data, parseInt(volSmaMatch[1]), index);
      
      console.warn(`Unknown indicator: ${ind}`);
      return data[index].close;
  }
}
