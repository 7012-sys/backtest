// Trade Simulator Module
// Handles candle-by-candle trade execution

import { OHLCV, Trade, Position, EquityPoint, BacktestConfig } from './types';

export interface SimulationState {
  equity: number;
  peakEquity: number;
  maxDrawdown: number;
  position: Position | null;
  trades: Trade[];
  equityCurve: EquityPoint[];
  tradeId: number;
  skippedSignals: number; // Signals triggered but capital insufficient for even 1 unit
}

// Initialize simulation state
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

// Open a new position (with slippage applied)
export function openPosition(
  state: SimulationState,
  candle: OHLCV,
  candleIndex: number,
  config: BacktestConfig
): SimulationState {
  const positionSize = config.positionSizing || 0.95;
  const slippage = config.slippagePercent ? config.slippagePercent / 100 : 0;
  const entryPrice = candle.close * (1 + slippage); // Slippage increases entry cost
  let quantity = Math.floor((state.equity * positionSize) / entryPrice);
  
  // Enforce minimum quantity of 1 so small capital still generates trades
  if (quantity <= 0) {
    if (state.equity >= entryPrice * 0.01) {
      // Capital can cover at least a fractional unit — allow 1 unit
      quantity = 1;
    } else {
      // Truly insufficient capital — skip but track the signal
      return {
        ...state,
        skippedSignals: state.skippedSignals + 1,
      };
    }
  }

  // Apply commission on entry
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

// Close current position (with slippage and commission)
export function closePosition(
  state: SimulationState,
  candle: OHLCV,
  priceData: OHLCV[],
  config?: BacktestConfig
): SimulationState {
  if (!state.position) {
    return state;
  }
  
  const { entryIndex, entryPrice, quantity, side } = state.position;
  const slippage = config?.slippagePercent ? config.slippagePercent / 100 : 0;
  const exitPrice = candle.close * (1 - slippage); // Slippage reduces exit price
  
  // Calculate P&L based on position side
  let pnl: number;
  if (side === 'long') {
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    pnl = (entryPrice - exitPrice) * quantity;
  }

  // Apply exit commission
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
  
  // Mutable push for performance
  state.trades.push(newTrade);
  
  return {
    ...state,
    equity: state.equity + pnl,
    position: null,
    tradeId: state.tradeId + 1,
  };
}

// Update equity curve and drawdown tracking (mutable push for O(1) per candle)
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
  
  // Mutable push instead of spread for performance with large datasets
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

// Force close any open position (end of backtest)
export function forceClosePosition(
  state: SimulationState,
  priceData: OHLCV[],
  config?: BacktestConfig
): SimulationState {
  if (!state.position || priceData.length === 0) {
    return state;
  }
  
  const lastCandle = priceData[priceData.length - 1];
  return closePosition(state, lastCandle, priceData, config);
}

// Calculate position size based on risk management
export function calculatePositionSize(
  equity: number,
  entryPrice: number,
  stopLossPrice: number,
  riskPercent: number = 2
): number {
  const riskAmount = equity * (riskPercent / 100);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  
  if (riskPerShare === 0) {
    return Math.floor(equity * 0.95 / entryPrice);
  }
  
  return Math.floor(riskAmount / riskPerShare);
}
