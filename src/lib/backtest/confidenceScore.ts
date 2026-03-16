// Confidence Score Calculator
// Evaluates result reliability based on statistical measures

import { Trade, EquityPoint } from './types';

export interface ConfidenceBreakdown {
  tradeCountScore: number;
  sampleSizeScore: number;
  consistencyScore: number;
  drawdownRecoveryScore: number;
  overfitRiskScore: number;
  overall: number;
}

export function calculateConfidenceScore(
  trades: Trade[],
  equityCurve: EquityPoint[],
  parameterCount: number = 4,
  initialCapital: number = 100000
): ConfidenceBreakdown {
  // 1. Trade Count Score (0-25): More trades = more statistical significance
  const tradeCountScore = Math.min(25, Math.round((trades.length / 40) * 25));

  // 2. Sample Size vs Parameters (0-20): trades-to-parameter ratio
  const ratio = parameterCount > 0 ? trades.length / parameterCount : trades.length;
  const sampleSizeScore = Math.min(20, Math.round((ratio / 10) * 20));

  // 3. Consistency Score (0-25): Low variance in trade returns
  let consistencyScore = 0;
  if (trades.length >= 5) {
    const returns = trades.map(t => t.pnlPercent);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returns.length;
    const cv = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 10;
    consistencyScore = Math.min(25, Math.round(Math.max(0, (1 - cv / 5)) * 25));
  }

  // 4. Drawdown Recovery (0-15): How well equity recovers
  let drawdownRecoveryScore = 15;
  if (equityCurve.length > 10) {
    let peak = initialCapital;
    let maxDDPct = 0;
    for (const pt of equityCurve) {
      peak = Math.max(peak, pt.equity);
      const dd = (peak - pt.equity) / peak;
      maxDDPct = Math.max(maxDDPct, dd);
    }
    const finalEquity = equityCurve[equityCurve.length - 1].equity;
    const recovered = finalEquity >= peak;
    drawdownRecoveryScore = recovered
      ? Math.min(15, Math.round((1 - maxDDPct) * 15))
      : Math.round(Math.max(0, (1 - maxDDPct * 2)) * 15);
  }

  // 5. Overfit Risk (0-15): Penalize high parameter count with few trades
  const overfitRiskScore = Math.min(15, Math.round(Math.max(0, 1 - parameterCount / Math.max(1, trades.length / 3)) * 15));

  const overall = Math.min(100, Math.max(0, tradeCountScore + sampleSizeScore + consistencyScore + drawdownRecoveryScore + overfitRiskScore));

  return {
    tradeCountScore,
    sampleSizeScore,
    consistencyScore,
    drawdownRecoveryScore,
    overfitRiskScore,
    overall,
  };
}
