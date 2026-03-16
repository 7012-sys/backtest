// Excel Export Module (Pro Feature)
import * as XLSX from 'xlsx';

interface ExportData {
  symbol: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  maxDrawdown: number;
  roi: number;
  sharpeRatio: number;
  sortinoRatio?: number;
  calmarRatio?: number;
  expectancy?: number;
  cagr?: number;
  recoveryFactor?: number;
  finalEquity: number;
  trades?: Array<{
    id: string;
    entryDate: string;
    exitDate: string;
    entryPrice: number;
    exitPrice: number;
    side: string;
    quantity: number;
    pnl: number;
    pnlPercent: number;
    holdingDays: number;
  }>;
  equityCurve?: Array<{ day: number; date: string; equity: number }>;
  monthlyReturns?: Array<{ month: string; return: number }>;
}

// Ensure value is a clean number for Excel
function toNum(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

export function exportBacktestToExcel(data: ExportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['TradeTest - Backtest Report'],
    ['Symbol', data.symbol],
    ['Generated', new Date().toISOString().split('T')[0]],
    [],
    ['Metric', 'Value'],
    ['Net P&L', toNum(data.netPnl)],
    ['ROI (%)', toNum(data.roi)],
    ['Win Rate (%)', toNum(data.winRate)],
    ['Total Trades', Number(data.totalTrades) || 0],
    ['Winning Trades', Number(data.winningTrades) || 0],
    ['Losing Trades', Number(data.losingTrades) || 0],
    ['Profit Factor', toNum(data.profitFactor)],
    ['Max Drawdown', toNum(data.maxDrawdown)],
    ['Sharpe Ratio', toNum(data.sharpeRatio)],
    ['Final Equity', toNum(data.finalEquity)],
  ];

  if (data.sortinoRatio != null) summaryData.push(['Sortino Ratio', toNum(data.sortinoRatio)]);
  if (data.calmarRatio != null) summaryData.push(['Calmar Ratio', toNum(data.calmarRatio)]);
  if (data.cagr != null) summaryData.push(['CAGR (%)', toNum(data.cagr)]);
  if (data.recoveryFactor != null) summaryData.push(['Recovery Factor', toNum(data.recoveryFactor)]);
  if (data.expectancy != null) summaryData.push(['Expectancy', toNum(data.expectancy)]);

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Sheet 2: Trade Log
  if (data.trades && data.trades.length > 0) {
    const tradeHeaders = ['Trade ID', 'Entry Date', 'Exit Date', 'Side', 'Quantity', 'Entry Price', 'Exit Price', 'P&L', 'P&L %', 'Holding Days'];
    const tradeRows = data.trades.map(t => [
      t.id,
      t.entryDate,
      t.exitDate,
      t.side.toUpperCase(),
      Number(t.quantity) || 0,
      toNum(t.entryPrice),
      toNum(t.exitPrice),
      toNum(t.pnl),
      toNum(t.pnlPercent),
      Number(t.holdingDays) || 0,
    ]);
    const tradeSheet = XLSX.utils.aoa_to_sheet([tradeHeaders, ...tradeRows]);
    tradeSheet['!cols'] = tradeHeaders.map(() => ({ wch: 14 }));
    XLSX.utils.book_append_sheet(wb, tradeSheet, 'Trade Log');
  }

  // Sheet 3: Equity Curve
  if (data.equityCurve && data.equityCurve.length > 0) {
    const eqHeaders = ['Day', 'Date', 'Equity'];
    const eqRows = data.equityCurve.map(p => [
      Number(p.day) || 0,
      p.date,
      toNum(p.equity),
    ]);
    const eqSheet = XLSX.utils.aoa_to_sheet([eqHeaders, ...eqRows]);
    XLSX.utils.book_append_sheet(wb, eqSheet, 'Equity Curve');
  }

  // Sheet 4: Monthly Returns
  if (data.monthlyReturns && data.monthlyReturns.length > 0) {
    const mHeaders = ['Month', 'Return (%)'];
    const mRows = data.monthlyReturns.map(m => [
      m.month,
      toNum(m.return),
    ]);
    const mSheet = XLSX.utils.aoa_to_sheet([mHeaders, ...mRows]);
    XLSX.utils.book_append_sheet(wb, mSheet, 'Monthly Returns');
  }

  XLSX.writeFile(wb, `TradeTest_${data.symbol}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
