// Strategy Parser Module
// Converts JSON rules into executable trading logic

import { OHLCV, StrategyRule } from './types';
import { getIndicatorValue } from './indicators';

// ─── AI Rule Normalizer ──────────────────────────────────────────────────────
// Maps AI-generated indicator names and field keys → engine-compatible format

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
};

export function normalizeAIRules(rules: any[]): StrategyRule[] {
  if (!Array.isArray(rules)) return [];
  return rules.map((rule: any) => {
    const rawIndicator = rule.indicator;
    const indicatorKey = (typeof rawIndicator === 'string' ? rawIndicator : String(rawIndicator ?? '')).toLowerCase().trim();
    
    // Handle period-based indicator (e.g., indicator="SMA" with period=50)
    const period = rule.period ?? null;
    let mappedIndicator = AI_INDICATOR_MAP[indicatorKey] || indicatorKey || 'price';
    
    // If rule has a period, try to map to specific variant (e.g., sma_50)
    if (period && ['sma', 'ema', 'rsi'].includes(indicatorKey)) {
      const specificKey = `${indicatorKey}_${period}`;
      mappedIndicator = specificKey;
    }

    // Normalize value: can be number, string indicator reference, or object {period, indicator}
    let value: string | number = normalizeRuleValue(rule.value ?? rule.target ?? 0);

    // Normalize condition aliases
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

    // Map `connector` → `logic`
    const logic = rule.logic || rule.connector || undefined;

    return {
      indicator: mappedIndicator,
      condition,
      value,
      ...(logic ? { logic: logic as 'AND' | 'OR' } : {}),
    } as StrategyRule;
  });
}

// Convert complex value types into engine-compatible string/number
function normalizeRuleValue(value: any): string | number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num) && value.trim() === String(num)) return num;
    // Map string indicator references through the AI map
    const lower = value.toLowerCase().trim();
    return AI_INDICATOR_MAP[lower] || lower;
  }
  // Object value like {period: 200, indicator: "SMA"} or {type: "stop_loss", ...}
  if (typeof value === 'object' && value !== null) {
    if (value.type === 'stop_loss' || value.type === 'take_profit') {
      // These are handled by the exit logic, return 0 as placeholder
      return 0;
    }
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
      // Assumes target is a percentage
      return current > 0 && (current / target) >= (1 + target / 100);
    case 'decreases_by':
      return current > 0 && (current / target) <= (1 - target / 100);
    default:
      return current > target;
  }
}

// Parse rule value - can be a number or another indicator
function parseRuleValue(
  value: string | number,
  data: OHLCV[],
  index: number
): number {
  if (typeof value === 'number') {
    return value;
  }
  
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    return numValue;
  }
  
  // Value is an indicator reference
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
  
  return {
    leftValue,
    rightValue,
    condition: rule.condition,
    isMet,
  };
}

// Check if all entry rules are satisfied (supports AND/OR logic)
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
    const { isMet } = checkRule(data, index, rule);
    
    if (i === 0) {
      result = isMet;
    } else {
      if (currentLogic === 'AND') {
        result = result && isMet;
      } else {
        result = result || isMet;
      }
    }
    
    // Update logic for next iteration
    if (rule.logic) {
      currentLogic = rule.logic;
    }
  }
  
  return result;
}

// Check if exit conditions are met
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
): { shouldExit: boolean; reason: string } {
  const currentPrice = data[index].close;
  const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  
  // Check stop loss
  const stopLoss = config.stopLossPercent ?? 3;
  if (pnlPercent <= -stopLoss) {
    return { shouldExit: true, reason: 'stop_loss' };
  }
  
  // Check take profit
  const takeProfit = config.takeProfitPercent ?? 5;
  if (pnlPercent >= takeProfit) {
    return { shouldExit: true, reason: 'take_profit' };
  }
  
  // Check max holding period
  const maxHolding = config.maxHoldingDays ?? 20;
  if (holdingDays >= maxHolding) {
    return { shouldExit: true, reason: 'max_holding' };
  }
  
  // Check custom exit rules
  for (const rule of rules) {
    // Handle special exit indicators
    if (rule.indicator === 'PROFIT') {
      if (pnlPercent >= parseFloat(String(rule.value))) {
        return { shouldExit: true, reason: 'profit_target' };
      }
      continue;
    }
    
    if (rule.indicator === 'LOSS') {
      if (pnlPercent <= -parseFloat(String(rule.value))) {
        return { shouldExit: true, reason: 'loss_limit' };
      }
      continue;
    }
    
    const { isMet } = checkRule(data, index, rule);
    if (isMet) {
      return { shouldExit: true, reason: 'rule_triggered' };
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
    
    // Also check value if it's an indicator reference
    if (typeof rule.value === 'string' && isNaN(parseFloat(rule.value))) {
      const valueIndicator = rule.value.toLowerCase();
      if (!allowedIndicators.includes(valueIndicator)) {
        blockedIndicators.push(rule.value);
      }
    }
  }
  
  return {
    isValid: blockedIndicators.length === 0,
    blockedIndicators: [...new Set(blockedIndicators)], // Remove duplicates
  };
}
