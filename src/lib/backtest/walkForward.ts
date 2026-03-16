// Walk-Forward Validation Module (Pro Feature)
// Splits data into rolling in-sample/out-of-sample windows

import { OHLCV, StrategyRule, BacktestResults, BacktestConfig } from './types';
import { runBacktest } from './engine';

export interface WalkForwardWindow {
  windowNumber: number;
  inSampleStart: string;
  inSampleEnd: string;
  outOfSampleStart: string;
  outOfSampleEnd: string;
  inSampleResults: {
    netPnl: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    totalTrades: number;
    roi: number;
  };
  outOfSampleResults: {
    netPnl: number;
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    totalTrades: number;
    roi: number;
  };
  efficiency: number; // OOS performance / IS performance ratio
}

export interface WalkForwardConfig {
  trainingPercent: number; // e.g. 70 = 70% training, 30% testing
  numberOfWindows: number; // How many rolling windows
  anchoredStart: boolean; // If true, training always starts from beginning
}

export interface WalkForwardResult {
  windows: WalkForwardWindow[];
  aggregateEfficiency: number;
  isRobust: boolean; // true if avg efficiency > 0.5
  avgInSampleReturn: number;
  avgOutOfSampleReturn: number;
  consistencyScore: number; // % of OOS windows that are profitable
}

export function runWalkForwardValidation(
  priceData: OHLCV[],
  entryRules: StrategyRule[],
  exitRules: StrategyRule[],
  initialCapital: number,
  wfConfig: WalkForwardConfig,
  backtestConfig: Partial<BacktestConfig> = {}
): WalkForwardResult {
  const totalBars = priceData.length;
  const { trainingPercent, numberOfWindows, anchoredStart } = wfConfig;
  
  // Calculate window sizes
  const windowSize = Math.floor(totalBars / numberOfWindows);
  const trainingSize = Math.floor(windowSize * (trainingPercent / 100));
  const testingSize = windowSize - trainingSize;
  
  if (trainingSize < 30 || testingSize < 10) {
    throw new Error("Not enough data for walk-forward validation. Need at least 30 training + 10 testing bars per window.");
  }

  const windows: WalkForwardWindow[] = [];

  for (let i = 0; i < numberOfWindows; i++) {
    const windowStart = anchoredStart ? 0 : i * windowSize;
    const trainEnd = windowStart + trainingSize;
    const testEnd = Math.min(trainEnd + testingSize, totalBars);

    if (testEnd > totalBars) break;

    const trainingData = priceData.slice(windowStart, trainEnd);
    const testingData = priceData.slice(trainEnd, testEnd);

    if (trainingData.length < 30 || testingData.length < 5) continue;

    // Run backtest on training data
    const isResults = runBacktest(trainingData, entryRules, exitRules, initialCapital, backtestConfig);
    // Run backtest on testing data
    const oosResults = runBacktest(testingData, entryRules, exitRules, initialCapital, backtestConfig);

    const efficiency = isResults.roi !== 0 ? oosResults.roi / isResults.roi : 0;

    windows.push({
      windowNumber: i + 1,
      inSampleStart: trainingData[0].date.split('T')[0],
      inSampleEnd: trainingData[trainingData.length - 1].date.split('T')[0],
      outOfSampleStart: testingData[0].date.split('T')[0],
      outOfSampleEnd: testingData[testingData.length - 1].date.split('T')[0],
      inSampleResults: {
        netPnl: isResults.netPnl,
        winRate: isResults.winRate,
        profitFactor: isResults.profitFactor,
        sharpeRatio: isResults.sharpeRatio,
        totalTrades: isResults.totalTrades,
        roi: isResults.roi,
      },
      outOfSampleResults: {
        netPnl: oosResults.netPnl,
        winRate: oosResults.winRate,
        profitFactor: oosResults.profitFactor,
        sharpeRatio: oosResults.sharpeRatio,
        totalTrades: oosResults.totalTrades,
        roi: oosResults.roi,
      },
      efficiency: Math.round(efficiency * 100) / 100,
    });
  }

  const avgEfficiency = windows.length > 0
    ? windows.reduce((sum, w) => sum + w.efficiency, 0) / windows.length
    : 0;

  const avgISReturn = windows.length > 0
    ? windows.reduce((sum, w) => sum + w.inSampleResults.roi, 0) / windows.length
    : 0;

  const avgOOSReturn = windows.length > 0
    ? windows.reduce((sum, w) => sum + w.outOfSampleResults.roi, 0) / windows.length
    : 0;

  const profitableOOS = windows.filter(w => w.outOfSampleResults.netPnl > 0).length;
  const consistencyScore = windows.length > 0 ? Math.round((profitableOOS / windows.length) * 100) : 0;

  return {
    windows,
    aggregateEfficiency: Math.round(avgEfficiency * 100) / 100,
    isRobust: avgEfficiency > 0.5,
    avgInSampleReturn: Math.round(avgISReturn * 100) / 100,
    avgOutOfSampleReturn: Math.round(avgOOSReturn * 100) / 100,
    consistencyScore,
  };
}

export function getDefaultWalkForwardConfig(): WalkForwardConfig {
  return {
    trainingPercent: 70,
    numberOfWindows: 4,
    anchoredStart: false,
  };
}
