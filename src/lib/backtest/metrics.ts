// Metrics Module
// Performance calculations for backtesting results

import { Trade, EquityPoint, MonthlyReturn } from './types';

export interface PerformanceMetrics {
  // Basic metrics (FREE)
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  
  // Advanced metrics (PRO)
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
  avgHoldingDays: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  expectancy: number;
  cagr: number;
  recoveryFactor: number;
}

// Calculate all performance metrics
export function calculateMetrics(
  trades: Trade[],
  equityCurve: EquityPoint[],
  initialCapital: number,
  maxDrawdown: number
): PerformanceMetrics {
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const netPnl = grossProfit - grossLoss;
  
  const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
  
  // Sharpe Ratio
  const sharpeRatio = calculateSharpeRatio(equityCurve);
  
  // Sortino Ratio
  const sortinoRatio = calculateSortinoRatio(equityCurve);
  
  // Calmar Ratio
  const calmarRatio = maxDrawdown > 0 
    ? (netPnl / initialCapital * 100) / (maxDrawdown / initialCapital * 100)
    : 0;
  
  // Consecutive wins/losses
  const { maxConsecWins, maxConsecLosses } = calculateConsecutive(trades);
  
  // Average holding period
  const avgHoldingDays = trades.length > 0
    ? trades.reduce((sum, t) => sum + t.holdingDays, 0) / trades.length
    : 0;
  
  // Largest win/loss
  const largestWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(t => t.pnl))
    : 0;
  const largestLoss = losingTrades.length > 0
    ? Math.min(...losingTrades.map(t => t.pnl))
    : 0;
  
  // Expectancy
  const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
  const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);
  
  const peakEquity = equityCurve.length > 0 
    ? Math.max(...equityCurve.map(e => e.equity))
    : initialCapital;
  
  // CAGR calculation
  let cagr = 0;
  if (equityCurve.length >= 2) {
    const firstDate = new Date(equityCurve[0].date);
    const lastDate = new Date(equityCurve[equityCurve.length - 1].date);
    const years = Math.max(0.01, (lastDate.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const finalEquity = equityCurve[equityCurve.length - 1].equity;
    if (initialCapital > 0 && finalEquity > 0) {
      cagr = (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100;
    }
  }

  // Recovery Factor = Net P&L / Max Drawdown
  const recoveryFactor = maxDrawdown > 0 ? netPnl / maxDrawdown : (netPnl > 0 ? 99.99 : 0);

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Math.round(winRate * 10000) / 100,
    netPnl: Math.round(netPnl),
    profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : (grossProfit > 0 ? 99.99 : 0),
    maxDrawdown: Math.round(maxDrawdown),
    maxDrawdownPercent: Math.round((maxDrawdown / peakEquity) * 10000) / 100,
    roi: Math.round((netPnl / initialCapital) * 10000) / 100,
    avgWin: Math.round(avgWin),
    avgLoss: Math.round(avgLoss),
    grossProfit: Math.round(grossProfit),
    grossLoss: Math.round(grossLoss),
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    sortinoRatio: Math.round(sortinoRatio * 100) / 100,
    calmarRatio: Math.round(calmarRatio * 100) / 100,
    avgHoldingDays: Math.round(avgHoldingDays * 10) / 10,
    largestWin: Math.round(largestWin),
    largestLoss: Math.round(largestLoss),
    consecutiveWins: maxConsecWins,
    consecutiveLosses: maxConsecLosses,
    expectancy: Math.round(expectancy),
    cagr: Math.round(cagr * 100) / 100,
    recoveryFactor: Math.round(recoveryFactor * 100) / 100,
  };
}

// Calculate Sharpe Ratio (annualized)
function calculateSharpeRatio(equityCurve: EquityPoint[], riskFreeRate: number = 0.05): number {
  if (equityCurve.length < 2) return 0;
  
  const dailyReturns = equityCurve.slice(1).map((e, i) => 
    (e.equity - equityCurve[i].equity) / equityCurve[i].equity
  );
  
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const dailyRiskFree = riskFreeRate / 252;
  const excessReturn = avgReturn - dailyRiskFree;
  
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  
  return (excessReturn / stdDev) * Math.sqrt(252);
}

// Calculate Sortino Ratio (only penalizes downside volatility)
function calculateSortinoRatio(equityCurve: EquityPoint[], riskFreeRate: number = 0.05): number {
  if (equityCurve.length < 2) return 0;
  
  const dailyReturns = equityCurve.slice(1).map((e, i) => 
    (e.equity - equityCurve[i].equity) / equityCurve[i].equity
  );
  
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const dailyRiskFree = riskFreeRate / 252;
  const excessReturn = avgReturn - dailyRiskFree;
  
  // Only consider negative returns for downside deviation
  const negativeReturns = dailyReturns.filter(r => r < 0);
  if (negativeReturns.length === 0) return excessReturn > 0 ? 99.99 : 0;
  
  const downsideVariance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);
  
  if (downsideDeviation === 0) return 0;
  
  return (excessReturn / downsideDeviation) * Math.sqrt(252);
}

// Calculate consecutive wins and losses
function calculateConsecutive(trades: Trade[]): { maxConsecWins: number; maxConsecLosses: number } {
  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;
  
  for (const trade of trades) {
    if (trade.pnl > 0) {
      currentWins++;
      currentLosses = 0;
      maxConsecWins = Math.max(maxConsecWins, currentWins);
    } else {
      currentLosses++;
      currentWins = 0;
      maxConsecLosses = Math.max(maxConsecLosses, currentLosses);
    }
  }
  
  return { maxConsecWins, maxConsecLosses };
}

// Calculate monthly returns
export function calculateMonthlyReturns(
  equityCurve: EquityPoint[]
): MonthlyReturn[] {
  const monthlyData: Record<string, { start: number; end: number }> = {};
  
  equityCurve.forEach(point => {
    const date = new Date(point.date);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { start: point.equity, end: point.equity };
    } else {
      monthlyData[monthKey].end = point.equity;
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    return: Math.round(((data.end - data.start) / data.start) * 10000) / 100,
  }));
}

// Filter metrics for FREE tier (only basic metrics)
export function getFreeTierMetrics(metrics: PerformanceMetrics): Partial<PerformanceMetrics> {
  return {
    totalTrades: metrics.totalTrades,
    winningTrades: metrics.winningTrades,
    losingTrades: metrics.losingTrades,
    winRate: metrics.winRate,
    netPnl: metrics.netPnl,
  };
}
