// Strategy Parser Module
// Converts JSON rules into executable trading logic

import { OHLCV, StrategyRule } from './types';
import { getIndicatorValue } from './indicators';

// ─── AI Rule Normalizer ──────────────────────────────────────────────────────
const AI_INDICATOR_MAP: Record<string, string> = {
  'sma': 'sma_20',
  'ema': 'ema_20',
  'rsi': 'rsi_14',
  'macd': 'macd',
  'macd signal': 'macd_signal',
  'macd_signal': 'macd_signal',
  'macd signal line': 'macd_signal',
  'bollinger upper': 'bollinger_upper',
  'bollinger lower': 'bollinger_lower',
  'bollinger middle': 'bollinger_middle',
  'bollinger bands upper': 'bollinger_upper',
  'bollinger bands lower': 'bollinger_lower',
  'bb upper': 'bollinger_upper',
  'bb lower': 'bollinger_lower',
  'bb middle': 'bollinger_middle',
  'bb width': 'bb_width',
  'bb squeeze': 'bb_width',
  'bollinger squeeze': 'bb_width',
  'atr': 'atr_14',
  'vwap': 'vwap',
  'stochastic k': 'stochastic_k',
  'stochastic d': 'stochastic_d',
  'stochastic': 'stochastic_k',
  'adx': 'adx',
  'cci': 'cci',
  'mfi': 'mfi',
  'obv': 'obv',
  'williams %r': 'williams_r',
  'williams r': 'williams_r',
  'williamsr': 'williams_r',
  'roc': 'roc',
  'parabolic sar': 'parabolic_sar',
  'price': 'price',
  'close': 'price',
  'volume': 'volume',
  'open': 'open',
  'high': 'high',
  'low': 'low',
  // Candlestick patterns
  'bullish engulfing': 'bullish_engulfing',
  'bearish engulfing': 'bearish_engulfing',
  'hammer': 'hammer',
  'shooting star': 'shooting_star',
  'morning star': 'morning_star',
  'doji': 'doji',
  'inside bar': 'inside_bar',
  // Breakout
  '20 day high': 'high_20',
  '20 day low': 'low_20',
  '52 week high': 'high_52w',
  '52 week low': 'low_52w',
  'prev day high': 'prev_day_high',
  'prev day low': 'prev_day_low',
  'volume sma': 'volume_sma_20',
  // Price Action - Opening Range
  'opening range high': 'opening_range_high',
  'opening range low': 'opening_range_low',
  'orb high': 'opening_range_high',
  'orb low': 'opening_range_low',
  // Price Action - Day levels
  'day high': 'day_high',
  'day low': 'day_low',
  'high 20': 'high_20',
  'low 20': 'low_20',
  // Price Action - Gap
  'gap up': 'gap_up',
  'gap down': 'gap_down',
  // Support & Resistance
  'support': 'support_level',
  'support level': 'support_level',
  'resistance': 'resistance_level',
  'resistance level': 'resistance_level',
};

export function normalizeAIRules(rules: any[]): StrategyRule[] {
  if (!Array.isArray(rules)) return [];
  return rules.map((rule: any) => {
    const rawIndicator = rule.indicator;
    const indicatorKey = (typeof rawIndicator === 'string' ? rawIndicator : String(rawIndicator ?? '')).toLowerCase().trim();
    
    const period = rule.period ?? null;
    let mappedIndicator = AI_INDICATOR_MAP[indicatorKey] || indicatorKey || 'price';
    
    if (period && ['sma', 'ema', 'rsi'].includes(indicatorKey)) {
      mappedIndicator = `${indicatorKey}_${period}`;
    }

    let value: string | number = normalizeRuleValue(rule.value ?? rule.target ?? 0);

    const conditionMap: Record<string, string> = {
      'greater than': 'greater_than',
      'less than': 'less_than',
      'above': 'above',
      'below': 'below',
      'crosses above': 'crosses_above',
      'crosses below': 'crosses_below',
      'equals': 'equals',
    };
    const rawCondition = (typeof rule.condition === 'string' ? rule.condition : String(rule.condition ?? 'greater_than')).toLowerCase().trim();
    const condition = conditionMap[rawCondition] || rawCondition;

    const logic = rule.logic || rule.connector || undefined;

    return {
      indicator: mappedIndicator,
      condition,
      value,
      ...(logic ? { logic: logic as 'AND' | 'OR' } : {}),
    } as StrategyRule;
  });
}

function normalizeRuleValue(value: any): string | number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num) && value.trim() === String(num)) return num;
    const lower = value.toLowerCase().trim();
    return AI_INDICATOR_MAP[lower] || lower;
  }
  if (typeof value === 'object' && value !== null) {
    if (value.type === 'stop_loss' || value.type === 'take_profit') return 0;
    if (value.indicator && value.period) {
      const indKey = (typeof value.indicator === 'string' ? value.indicator : String(value.indicator)).toLowerCase().trim();
      return `${indKey}_${value.period}`;
    }
    if (value.indicator) {
      const indKey = (typeof value.indicator === 'string' ? value.indicator : String(value.indicator)).toLowerCase().trim();
      return AI_INDICATOR_MAP[indKey] || indKey;
    }
  }
  return 0;
}



export interface ParsedCondition {
  leftValue: number;
  rightValue: number;
  condition: string;
  isMet: boolean;
}

// Evaluate a single condition
function evaluateCondition(current: number, condition: string, target: number): boolean {
  switch (condition) {
    case 'crosses_above':
    case 'greater_than':
    case 'above':
      return current > target;
    case 'crosses_below':
    case 'less_than':
    case 'below':
      return current < target;
    case 'equals':
      return Math.abs(current - target) < 0.01;
    case 'increases_by':
      return current > 0 && (current / target) >= (1 + target / 100);
    case 'decreases_by':
      return current > 0 && (current / target) <= (1 - target / 100);
    default:
      return current > target;
  }
}

function parseRuleValue(
  value: string | number,
  data: OHLCV[],
  index: number
): number {
  if (typeof value === 'number') return value;
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) return numValue;
  return getIndicatorValue(data, value, index);
}

// Check if a single rule is satisfied
export function checkRule(
  data: OHLCV[],
  index: number,
  rule: StrategyRule
): ParsedCondition {
  const leftValue = getIndicatorValue(data, rule.indicator, index);
  const rightValue = parseRuleValue(rule.value, data, index);
  const isMet = evaluateCondition(leftValue, rule.condition, rightValue);
  
  return { leftValue, rightValue, condition: rule.condition, isMet };
}

// Check if all entry rules are satisfied (supports AND/OR logic)
// Uses candle HIGH for breakout-above checks, candle LOW for breakout-below
export function checkEntrySignal(
  data: OHLCV[],
  index: number,
  rules: StrategyRule[]
): boolean {
  if (index < 30 || rules.length === 0) return false;
  
  let result = true;
  let currentLogic: 'AND' | 'OR' = 'AND';
  
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    // For entry signals: use high for crosses_above/greater_than, low for crosses_below/less_than
    const { isMet } = checkRuleWithHighLow(data, index, rule);
    
    if (i === 0) {
      result = isMet;
    } else {
      if (currentLogic === 'AND') {
        result = result && isMet;
      } else {
        result = result || isMet;
      }
    }
    
    if (rule.logic) {
      currentLogic = rule.logic;
    }
  }
  
  return result;
}

/**
 * Enhanced rule check that uses candle high/low for price-based comparisons.
 * - For "crosses_above" / "greater_than" → check candle.high against target
 * - For "crosses_below" / "less_than" → check candle.low against target
 * - For indicator-vs-indicator comparisons (both non-price), use standard close-based values
 */
function checkRuleWithHighLow(
  data: OHLCV[],
  index: number,
  rule: StrategyRule
): ParsedCondition {
  const indicator = rule.indicator.toLowerCase();
  const condition = rule.condition;
  
  // Determine if this is a price-based indicator
  const isPriceIndicator = ['price', 'close', 'high', 'low', 'open'].includes(indicator);
  
  if (isPriceIndicator) {
    const rightValue = parseRuleValue(rule.value, data, index);
    
    // Use high for upward breakouts, low for downward breakouts
    if (condition === 'crosses_above' || condition === 'greater_than' || condition === 'above') {
      const leftValue = data[index].high;
      return { leftValue, rightValue, condition, isMet: leftValue > rightValue };
    }
    if (condition === 'crosses_below' || condition === 'less_than' || condition === 'below') {
      const leftValue = data[index].low;
      return { leftValue, rightValue, condition, isMet: leftValue < rightValue };
    }
  }
  
  // Default: standard indicator-based evaluation
  return checkRule(data, index, rule);
}

// Check if exit conditions are met — uses high/low for SL/TP evaluation
// Order: 1. StopLoss (check low), 2. TakeProfit (check high), 3. MaxHolding, 4. Custom rules
export function checkExitSignal(
  data: OHLCV[],
  index: number,
  rules: StrategyRule[],
  entryPrice: number,
  holdingDays: number,
  config: {
    stopLossPercent?: number;
    takeProfitPercent?: number;
    maxHoldingDays?: number;
  } = {}
): { shouldExit: boolean; reason: string; exitPrice?: number } {
  const candle = data[index];

  // ── 1. Check stop loss using candle LOW ──
  const stopLoss = config.stopLossPercent ?? 3;
  const stopLossPrice = entryPrice * (1 - stopLoss / 100);
  if (candle.low <= stopLossPrice) {
    return { shouldExit: true, reason: 'stop_loss', exitPrice: stopLossPrice };
  }

  // ── 2. Check take profit using candle HIGH ──
  const takeProfit = config.takeProfitPercent ?? 5;
  const takeProfitPrice = entryPrice * (1 + takeProfit / 100);
  if (candle.high >= takeProfitPrice) {
    return { shouldExit: true, reason: 'take_profit', exitPrice: takeProfitPrice };
  }

  // ── 3. Check max holding period ──
  const maxHolding = config.maxHoldingDays ?? 20;
  if (holdingDays >= maxHolding) {
    return { shouldExit: true, reason: 'max_holding', exitPrice: candle.close };
  }

  // ── 4. Check custom exit rules ──
  for (const rule of rules) {
    if (rule.indicator === 'PROFIT') {
      const profitPct = ((candle.high - entryPrice) / entryPrice) * 100;
      if (profitPct >= parseFloat(String(rule.value))) {
        return { shouldExit: true, reason: 'profit_target', exitPrice: entryPrice * (1 + parseFloat(String(rule.value)) / 100) };
      }
      continue;
    }
    
    if (rule.indicator === 'LOSS') {
      const lossPct = ((entryPrice - candle.low) / entryPrice) * 100;
      if (lossPct >= parseFloat(String(rule.value))) {
        return { shouldExit: true, reason: 'loss_limit', exitPrice: entryPrice * (1 - parseFloat(String(rule.value)) / 100) };
      }
      continue;
    }

    // Use high/low aware check for custom exit rules too
    const { isMet } = checkRuleWithHighLow(data, index, rule);
    if (isMet) {
      return { shouldExit: true, reason: 'rule_triggered', exitPrice: candle.close };
    }
  }

  return { shouldExit: false, reason: '' };
}

// Validate that all indicators in rules are allowed for the user's plan
export function validateRulesForPlan(
  rules: StrategyRule[],
  allowedIndicators: string[]
): { isValid: boolean; blockedIndicators: string[] } {
  const blockedIndicators: string[] = [];
  
  for (const rule of rules) {
    const indicator = rule.indicator.toLowerCase();
    if (!allowedIndicators.includes(indicator)) {
      blockedIndicators.push(rule.indicator);
    }
    if (typeof rule.value === 'string' && isNaN(parseFloat(rule.value))) {
      const valueIndicator = rule.value.toLowerCase();
      if (!allowedIndicators.includes(valueIndicator)) {
        blockedIndicators.push(rule.value);
      }
    }
  }
  
  return {
    isValid: blockedIndicators.length === 0,
    blockedIndicators: [...new Set(blockedIndicators)],
  };
}
