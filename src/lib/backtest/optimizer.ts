// Optimizer Module (PRO Feature)
// Parameter optimization and grid search for strategy tuning

import { OHLCV, StrategyRule, BacktestResults, BacktestConfig } from './types';
import { runBacktest } from './engine';

export interface OptimizationParameter {
  name: string;
  min: number;
  max: number;
  step: number;
  currentValue: number;
}

export interface OptimizationResult {
  parameters: Record<string, number>;
  metrics: {
    netPnl: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  score: number; // Weighted optimization score
}

export interface OptimizationConfig {
  optimizeFor: 'profit' | 'sharpe' | 'winRate' | 'balanced';
  maxIterations?: number;
  stopLossRange?: { min: number; max: number; step: number };
  takeProfitRange?: { min: number; max: number; step: number };
  indicatorParams?: OptimizationParameter[];
}

// Generate all parameter combinations for grid search
function* generateCombinations(
  params: OptimizationParameter[]
): Generator<Record<string, number>> {
  if (params.length === 0) {
    yield {};
    return;
  }
  
  const [first, ...rest] = params;
  const restCombinations = [...generateCombinations(rest)];
  
  for (let value = first.min; value <= first.max; value += first.step) {
    for (const combo of restCombinations) {
      yield { ...combo, [first.name]: value };
    }
  }
}

// Calculate optimization score based on config
function calculateScore(
  result: BacktestResults,
  optimizeFor: OptimizationConfig['optimizeFor']
): number {
  const { netPnl, winRate, profitFactor, sharpeRatio, maxDrawdown, totalTrades } = result;
  
  // Penalize strategies with too few trades
  if (totalTrades < 5) return -Infinity;
  
  switch (optimizeFor) {
    case 'profit':
      return netPnl - (maxDrawdown * 0.5); // Profit with drawdown penalty
    
    case 'sharpe':
      return sharpeRatio * 1000; // Scale for comparison
    
    case 'winRate':
      return winRate * 100 + (profitFactor * 10);
    
    case 'balanced':
    default:
      // Weighted combination of all factors
      const profitScore = Math.min(netPnl / 10000, 10) * 25; // Cap at 25 points
      const sharpeScore = Math.min(sharpeRatio, 3) * 10; // Cap at 30 points
      const winRateScore = (winRate / 100) * 20; // Max 20 points
      const pfScore = Math.min(profitFactor, 3) * 10; // Cap at 30 points
      const ddPenalty = (maxDrawdown / 10000) * 5; // Drawdown penalty
      
      return profitScore + sharpeScore + winRateScore + pfScore - ddPenalty;
  }
}

// Run grid search optimization
export async function runOptimization(
  priceData: OHLCV[],
  entryRules: StrategyRule[],
  exitRules: StrategyRule[],
  config: OptimizationConfig,
  initialCapital: number,
  onProgress?: (progress: number, current: OptimizationResult) => void
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = [];
  
  // Build parameter grid
  const params: OptimizationParameter[] = [];
  
  if (config.stopLossRange) {
    params.push({
      name: 'stopLoss',
      min: config.stopLossRange.min,
      max: config.stopLossRange.max,
      step: config.stopLossRange.step,
      currentValue: config.stopLossRange.min,
    });
  }
  
  if (config.takeProfitRange) {
    params.push({
      name: 'takeProfit',
      min: config.takeProfitRange.min,
      max: config.takeProfitRange.max,
      step: config.takeProfitRange.step,
      currentValue: config.takeProfitRange.min,
    });
  }
  
  if (config.indicatorParams) {
    params.push(...config.indicatorParams);
  }
  
  // Count total combinations
  let totalCombinations = 1;
  params.forEach(p => {
    totalCombinations *= Math.ceil((p.max - p.min) / p.step) + 1;
  });
  
  const maxIterations = config.maxIterations || 1000;
  const combinations = generateCombinations(params);
  let iteration = 0;
  
  for (const paramSet of combinations) {
    if (iteration >= maxIterations) break;
    
    // Apply parameters to backtest config
    const backtestConfig: BacktestConfig = {
      initialCapital,
      positionSizing: 0.95,
      stopLossPercent: paramSet.stopLoss ?? 3,
      takeProfitPercent: paramSet.takeProfit ?? 5,
    };
    
    // Run backtest with current parameters
    const result = runBacktest(priceData, entryRules, exitRules, initialCapital, backtestConfig);
    
    const score = calculateScore(result, config.optimizeFor);
    
    const optResult: OptimizationResult = {
      parameters: paramSet,
      metrics: {
        netPnl: result.netPnl,
        winRate: result.winRate,
        profitFactor: result.profitFactor,
        sharpeRatio: result.sharpeRatio,
        maxDrawdown: result.maxDrawdown,
      },
      score,
    };
    
    results.push(optResult);
    
    // Report progress
    if (onProgress) {
      const progress = Math.round((iteration / Math.min(totalCombinations, maxIterations)) * 100);
      onProgress(progress, optResult);
    }
    
    iteration++;
  }
  
  // Sort by score (best first)
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

// Quick optimization with smart defaults
export function getOptimizationDefaults(): OptimizationConfig {
  return {
    optimizeFor: 'balanced',
    maxIterations: 100,
    stopLossRange: { min: 1, max: 5, step: 0.5 },
    takeProfitRange: { min: 2, max: 10, step: 1 },
  };
}
