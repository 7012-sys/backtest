// Excel Export Module (Pro Feature)
import ExcelJS from 'exceljs';

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

function toNum(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

export async function exportBacktestToExcel(data: ExportData) {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Summary
  const summarySheet = wb.addWorksheet('Summary');
  summarySheet.columns = [{ width: 20 }, { width: 20 }];

  const summaryRows: Array<[string, string | number] | []> = [
    ['TradeTest - Backtest Report', ''],
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

  if (data.sortinoRatio != null) summaryRows.push(['Sortino Ratio', toNum(data.sortinoRatio)]);
  if (data.calmarRatio != null) summaryRows.push(['Calmar Ratio', toNum(data.calmarRatio)]);
  if (data.cagr != null) summaryRows.push(['CAGR (%)', toNum(data.cagr)]);
  if (data.recoveryFactor != null) summaryRows.push(['Recovery Factor', toNum(data.recoveryFactor)]);
  if (data.expectancy != null) summaryRows.push(['Expectancy', toNum(data.expectancy)]);

  summaryRows.forEach(row => summarySheet.addRow(row));

  // Sheet 2: Trade Log
  if (data.trades && data.trades.length > 0) {
    const tradeSheet = wb.addWorksheet('Trade Log');
    tradeSheet.columns = [
      { header: 'Trade ID', width: 14 },
      { header: 'Entry Date', width: 14 },
      { header: 'Exit Date', width: 14 },
      { header: 'Side', width: 14 },
      { header: 'Quantity', width: 14 },
      { header: 'Entry Price', width: 14 },
      { header: 'Exit Price', width: 14 },
      { header: 'P&L', width: 14 },
      { header: 'P&L %', width: 14 },
      { header: 'Holding Days', width: 14 },
    ];
    data.trades.forEach(t => {
      tradeSheet.addRow([
        t.id, t.entryDate, t.exitDate, t.side.toUpperCase(),
        Number(t.quantity) || 0, toNum(t.entryPrice), toNum(t.exitPrice),
        toNum(t.pnl), toNum(t.pnlPercent), Number(t.holdingDays) || 0,
      ]);
    });
  }

  // Sheet 3: Equity Curve
  if (data.equityCurve && data.equityCurve.length > 0) {
    const eqSheet = wb.addWorksheet('Equity Curve');
    eqSheet.columns = [
      { header: 'Day', width: 10 },
      { header: 'Date', width: 14 },
      { header: 'Equity', width: 14 },
    ];
    data.equityCurve.forEach(p => {
      eqSheet.addRow([Number(p.day) || 0, p.date, toNum(p.equity)]);
    });
  }

  // Sheet 4: Monthly Returns
  if (data.monthlyReturns && data.monthlyReturns.length > 0) {
    const mSheet = wb.addWorksheet('Monthly Returns');
    mSheet.columns = [
      { header: 'Month', width: 14 },
      { header: 'Return (%)', width: 14 },
    ];
    data.monthlyReturns.forEach(m => {
      mSheet.addRow([m.month, toNum(m.return)]);
    });
  }

  // Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TradeTest_${data.symbol}_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
