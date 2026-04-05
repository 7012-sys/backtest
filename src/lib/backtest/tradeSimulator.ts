// Trade Simulator Module
// Handles candle-by-candle trade execution with accurate high/low price logic

import { OHLCV, Trade, Position, EquityPoint, BacktestConfig } from './types';

export interface SimulationState {
  equity: number;
  peakEquity: number;
  maxDrawdown: number;
  position: Position | null;
  trades: Trade[];
  equityCurve: EquityPoint[];
  tradeId: number;
  skippedSignals: number;
}

export function initializeSimulation(initialCapital: number): SimulationState {
  return {
    equity: initialCapital,
    peakEquity: initialCapital,
    maxDrawdown: 0,
    position: null,
    trades: [],
    equityCurve: [],
    tradeId: 1,
    skippedSignals: 0,
  };
}

// Open a new position — entry at candle close with slippage (signal confirmed at close)
export function openPosition(
  state: SimulationState,
  candle: OHLCV,
  candleIndex: number,
  config: BacktestConfig
): SimulationState {
  const positionSize = config.positionSizing || 0.95;
  const slippage = config.slippagePercent ? config.slippagePercent / 100 : 0;
  const entryPrice = candle.close * (1 + slippage);
  let quantity = Math.floor((state.equity * positionSize) / entryPrice);
  
  if (quantity <= 0) {
    if (state.equity >= entryPrice * 0.01) {
      quantity = 1;
    } else {
      return { ...state, skippedSignals: state.skippedSignals + 1 };
    }
  }

  const commission = config.commissionPercent ? (entryPrice * quantity * config.commissionPercent / 100) : 0;
  
  if (typeof window !== 'undefined' && (window as any).__BACKTEST_DEBUG__) {
    console.log(`[BT] ENTRY @ candle ${candleIndex} | price=${entryPrice.toFixed(2)} | qty=${quantity} | commission=${commission.toFixed(2)} | equity=${(state.equity - commission).toFixed(2)}`);
  }

  return {
    ...state,
    equity: state.equity - commission,
    position: {
      entryIndex: candleIndex,
      entryPrice,
      quantity,
      side: 'long',
      entryCommission: commission,
    },
  };
}

// Close current position — accepts optional specific exitPrice from SL/TP logic
export function closePosition(
  state: SimulationState,
  candle: OHLCV,
  candleIndex: number,
  config?: BacktestConfig,
  specificExitPrice?: number
): SimulationState {
  if (!state.position) return state;
  
  const { entryIndex, entryPrice, quantity, side, entryCommission } = state.position;
  const slippage = config?.slippagePercent ? config.slippagePercent / 100 : 0;
  
  // Use specific exit price (from SL/TP) or fall back to candle close with slippage
  const exitPrice = specificExitPrice
    ? specificExitPrice * (1 - slippage)
    : candle.close * (1 - slippage);
  
  // PnL = (Exit - Entry) × Quantity for long, reversed for short
  let pnl: number;
  if (side === 'long') {
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    pnl = (entryPrice - exitPrice) * quantity;
  }

  const exitCommission = config?.commissionPercent ? (exitPrice * quantity * config.commissionPercent / 100) : 0;
  // Include BOTH entry and exit commissions in trade PnL so netPnl matches finalEquity
  pnl -= (entryCommission + exitCommission);
  
  const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * (side === 'long' ? 1 : -1);
  const holdingDays = Math.max(1, candleIndex - entryIndex);
  
  const newTrade: Trade = {
    id: `T${state.tradeId}`,
    entryDate: candle.date && state.position ? '' : '', // placeholder, set below
    entryPrice,
    exitDate: candle.date.split('T')[0],
    exitPrice,
    side,
    quantity,
    pnl: Math.round(pnl * 100) / 100,
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    holdingDays,
  };

  // We need priceData to get entry date - pass it via a workaround
  // entryDate is set by the engine after calling this function
  newTrade.entryDate = `entry_index_${entryIndex}`;

  // Entry commission was already deducted from equity on open, so add it back
  // since it's now included in pnl. Net effect: equity += pricePnl - exitCommission
  const newEquity = state.equity + pnl + entryCommission;

  if (typeof window !== 'undefined' && (window as any).__BACKTEST_DEBUG__) {
    console.log(`[BT] EXIT @ candle ${candleIndex} | exitPrice=${exitPrice.toFixed(2)} | pnl=${pnl.toFixed(2)} | equity=${newEquity.toFixed(2)} | holding=${holdingDays}d`);
  }

  return {
    ...state,
    equity: newEquity,
    position: null,
    trades: [...state.trades, newTrade],
    tradeId: state.tradeId + 1,
  };
}

// Update equity curve and drawdown tracking
export function updateEquityCurve(
  state: SimulationState,
  candle: OHLCV,
  dayNumber: number
): SimulationState {
  let currentEquity = state.equity;
  if (state.position) {
    const unrealizedPnl = (candle.close - state.position.entryPrice) * state.position.quantity;
    currentEquity += unrealizedPnl;
  }
  
  currentEquity = Math.round(currentEquity);
  
  const newPeakEquity = Math.max(state.peakEquity, currentEquity);
  const drawdown = newPeakEquity - currentEquity;
  const newMaxDrawdown = Math.max(state.maxDrawdown, drawdown);
  
  return {
    ...state,
    equityCurve: [...state.equityCurve, {
      day: dayNumber,
      date: candle.date.split('T')[0],
      equity: currentEquity,
    }],
    peakEquity: newPeakEquity,
    maxDrawdown: newMaxDrawdown,
  };
}

export function forceClosePosition(
  state: SimulationState,
  priceData: OHLCV[],
  config?: BacktestConfig
): SimulationState {
  if (!state.position || priceData.length === 0) return state;
  const lastCandle = priceData[priceData.length - 1];
  const lastIndex = priceData.length - 1;
  return closePosition(state, lastCandle, lastIndex, config);
}

export function calculatePositionSize(
  equity: number,
  entryPrice: number,
  stopLossPrice: number,
  riskPercent: number = 2
): number {
  const riskAmount = equity * (riskPercent / 100);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  if (riskPerShare === 0) return Math.floor(equity * 0.95 / entryPrice);
  return Math.floor(riskAmount / riskPerShare);
}
