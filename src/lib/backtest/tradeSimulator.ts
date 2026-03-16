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

// Open a new position — uses candle.high as entry for breakout (more realistic)
export function openPosition(
  state: SimulationState,
  candle: OHLCV,
  candleIndex: number,
  config: BacktestConfig
): SimulationState {
  const positionSize = config.positionSizing || 0.95;
  const slippage = config.slippagePercent ? config.slippagePercent / 100 : 0;
  // Entry at close with slippage (conservative — signal confirmed at candle close)
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
  
  return {
    ...state,
    equity: state.equity - commission,
    position: {
      entryIndex: candleIndex,
      entryPrice,
      quantity,
      side: 'long',
    },
  };
}

// Close current position — accepts optional specific exitPrice from SL/TP logic
export function closePosition(
  state: SimulationState,
  candle: OHLCV,
  priceData: OHLCV[],
  config?: BacktestConfig,
  specificExitPrice?: number
): SimulationState {
  if (!state.position) return state;
  
  const { entryIndex, entryPrice, quantity, side } = state.position;
  const slippage = config?.slippagePercent ? config.slippagePercent / 100 : 0;
  
  // Use specific exit price (from SL/TP) or fall back to candle close with slippage
  const exitPrice = specificExitPrice
    ? specificExitPrice * (1 - slippage)
    : candle.close * (1 - slippage);
  
  let pnl: number;
  if (side === 'long') {
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    pnl = (entryPrice - exitPrice) * quantity;
  }

  const commission = config?.commissionPercent ? (exitPrice * quantity * config.commissionPercent / 100) : 0;
  pnl -= commission;
  
  const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 * (side === 'long' ? 1 : -1);
  const holdingDays = priceData.findIndex(c => c.date === candle.date) - entryIndex;
  
  const newTrade: Trade = {
    id: `T${state.tradeId}`,
    entryDate: priceData[entryIndex].date.split('T')[0],
    entryPrice,
    exitDate: candle.date.split('T')[0],
    exitPrice,
    side,
    quantity,
    pnl: Math.round(pnl),
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    holdingDays: Math.max(1, holdingDays),
  };
  
  state.trades.push(newTrade);
  
  return {
    ...state,
    equity: state.equity + pnl,
    position: null,
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
  
  state.equityCurve.push({
    day: dayNumber,
    date: candle.date.split('T')[0],
    equity: currentEquity,
  });
  
  return {
    ...state,
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
  return closePosition(state, lastCandle, priceData, config);
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
