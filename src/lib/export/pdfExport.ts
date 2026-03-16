// PDF Export Module (Pro Feature)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  }>;
}

// Plain number formatting that works reliably in PDF
function fmtCurrency(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  const formatted = abs.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}Rs.${formatted}`;
}

function fmtNum(val: number, decimals = 2): string {
  return val.toFixed(decimals);
}

export function exportBacktestToPdf(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TradeTest - Backtest Report', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Symbol: ${data.symbol} | Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 28);

  // Metrics table
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Summary', 14, 40);

  const metricsData = [
    ['Net P&L', fmtCurrency(data.netPnl), 'ROI', `${fmtNum(data.roi)}%`],
    ['Win Rate', `${fmtNum(data.winRate)}%`, 'Profit Factor', fmtNum(data.profitFactor)],
    ['Total Trades', String(data.totalTrades), 'Max Drawdown', fmtCurrency(data.maxDrawdown)],
    ['Winning', String(data.winningTrades), 'Losing', String(data.losingTrades)],
    ['Sharpe Ratio', fmtNum(data.sharpeRatio), 'Final Equity', fmtCurrency(data.finalEquity)],
  ];

  if (data.sortinoRatio != null) {
    metricsData.push(['Sortino Ratio', fmtNum(data.sortinoRatio), 'Calmar Ratio', fmtNum(data.calmarRatio ?? 0)]);
  }
  if (data.cagr != null) {
    metricsData.push(['CAGR', `${fmtNum(data.cagr)}%`, 'Recovery Factor', fmtNum(data.recoveryFactor ?? 0)]);
  }
  if (data.expectancy != null) {
    metricsData.push(['Expectancy', fmtCurrency(data.expectancy), '', '']);
  }

  autoTable(doc, {
    startY: 45,
    head: [],
    body: metricsData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 45 },
    },
  });

  // Trade log
  if (data.trades && data.trades.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Trade Log', 14, finalY + 10);

    const tradeRows = data.trades.map(t => [
      t.id,
      t.entryDate,
      t.exitDate,
      t.side.toUpperCase(),
      String(t.quantity),
      `Rs.${Number(t.entryPrice).toFixed(2)}`,
      `Rs.${Number(t.exitPrice).toFixed(2)}`,
      fmtCurrency(Number(t.pnl)),
      `${Number(t.pnlPercent) > 0 ? '+' : ''}${fmtNum(Number(t.pnlPercent))}%`,
    ]);

    autoTable(doc, {
      startY: finalY + 15,
      head: [['ID', 'Entry', 'Exit', 'Side', 'Qty', 'Entry Rs.', 'Exit Rs.', 'P&L', 'P&L %']],
      body: tradeRows,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      'TradeTest is a research tool. Not SEBI registered. Not financial advice.',
      pageWidth / 2, doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  doc.save(`TradeTest_${data.symbol}_${new Date().toISOString().split('T')[0]}.pdf`);
}
