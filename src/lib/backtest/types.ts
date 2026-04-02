// Shared types for the backtest engine

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  side: 'long' | 'short';
  quantity: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  roi: number;
  avgWin: number;
  avgLoss: number;
  grossProfit: number;
  grossLoss: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  expectancy: number;
  cagr: number;
  recoveryFactor: number;
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  finalEquity: number;
  trades: Trade[];
  priceData: OHLCV[];
  skippedSignals?: number; // Signals where capital was insufficient
  confidenceScore?: number;
  confidenceBreakdown?: {
    tradeCountScore: number;
    sampleSizeScore: number;
    consistencyScore: number;
    drawdownRecoveryScore: number;
    overfitRiskScore: number;
    overall: number;
  };
}

export interface EquityPoint {
  day: number;
  date: string;
  equity: number;
}

export interface MonthlyReturn {
  month: string;
  return: number;
}

export interface StrategyRule {
  indicator: string;
  condition: string;
  value: string | number;
  logic?: 'AND' | 'OR';
}

export interface Position {
  entryIndex: number;
  entryPrice: number;
  quantity: number;
  side: 'long' | 'short';
}

export interface BacktestConfig {
  initialCapital: number;
  positionSizing: number; // Percentage of capital to use (0-1)
  stopLossPercent?: number;
  takeProfitPercent?: number;
  maxHoldingDays?: number;
  allowShorts?: boolean;
  commissionPercent?: number; // Per-trade commission as % of trade value
  slippagePercent?: number; // Slippage as % applied to entry/exit prices
}

// Indicator result types
export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
}

export interface StochasticResult {
  k: number;
  d: number;
}

export interface ParabolicSARResult {
  sar: number;
  trend: 'bullish' | 'bearish';
}

// Indicator definitions for UI
export interface IndicatorDefinition {
  value: string;
  label: string;
  category: 'price' | 'trend' | 'momentum' | 'volatility' | 'volume' | 'breakout' | 'candlestick';
  isPro: boolean;
  description?: string;
  comingSoon?: boolean;
}

// FREE tier indicators
export const FREE_INDICATOR_VALUES = [
  'price', 'open', 'high', 'low', 'close',
  'sma_9', 'sma_20', 'sma_50', 'sma_100', 'sma_200',
  'ema_8', 'ema_9', 'ema_13', 'ema_20', 'ema_21', 'ema_34', 'ema_50',
  'rsi_7', 'rsi_14', 'rsi_21',
  'volume', 'volume_sma_20'
];

// PRO tier indicators (currently all unlocked)
export const PRO_INDICATOR_VALUES = [
  'macd', 'macd_signal', 'macd_histogram',
  'bollinger_upper', 'bollinger_middle', 'bollinger_lower', 'bb_width',
  'stochastic_k', 'stochastic_d',
  'adx', 'plus_di', 'minus_di',
  'atr_14',
  'parabolic_sar',
  'obv',
  'vwap',
  'cci',
  'mfi',
  'williams_r',
  'roc',
  // Breakout
  'high_20', 'low_20', 'high_52w', 'low_52w',
  'prev_day_high', 'prev_day_low',
  'opening_range_high', 'opening_range_low',
  'day_high', 'day_low',
  'gap_up', 'gap_down',
  // Candlestick patterns
  'bullish_engulfing', 'bearish_engulfing', 'hammer',
  'shooting_star', 'morning_star', 'doji', 'inside_bar',
];

// Coming Soon indicators (displayed in UI but not functional)
export const COMING_SOON_INDICATORS = [
  'fibonacci_38', 'fibonacci_50', 'fibonacci_62',
  'rsi_divergence', 'support_level', 'resistance_level',
  'relative_strength', 'gap_up', 'gap_down',
  'iron_condor', 'straddle', 'option_momentum',
];
