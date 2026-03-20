import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Percent,
  ArrowUpCircle,
  ArrowDownCircle,
  List,
  FileDown,
  FileSpreadsheet,
  Crown,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";
import { ConfidenceScore } from "./ConfidenceScore";
import { HealthPanel } from "./HealthPanel";
import { TradeTable } from "./TradeTable";
import { LearningMode } from "./LearningMode";
import { WalkForwardResults } from "./WalkForwardResults";
import { exportBacktestToPdf } from "@/lib/export/pdfExport";
import { exportBacktestToExcel } from "@/lib/export/excelExport";
import { ShareStrategyButton } from "./ShareStrategyButton";
import { AdvancedInsights } from "./AdvancedInsights";
import { toast } from "sonner";
import type { WalkForwardResult } from "@/lib/backtest/walkForward";

interface Trade {
  id: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  side: 'long' | 'short';
  quantity: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
}

interface BacktestResultsProps {
  results: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    netPnl: number;
    profitFactor: number;
    maxDrawdown: number;
    roi: number;
    avgWin: number;
    avgLoss: number;
    grossProfit: number;
    grossLoss: number;
    sharpeRatio: number;
    sortinoRatio?: number;
    calmarRatio?: number;
    expectancy?: number;
    cagr?: number;
    recoveryFactor?: number;
    confidenceScore?: number;
    confidenceBreakdown?: any;
    equityCurve: Array<{ day: number; date: string; equity: number }>;
    monthlyReturns: Array<{ month: string; return: number }>;
    finalEquity: number;
    trades?: Trade[];
    initialCapital?: number;
  };
  symbol: string;
  isPro?: boolean;
  entryRules?: any[];
  exitRules?: any[];
  walkForwardResult?: WalkForwardResult | null;
  startDate?: string;
  endDate?: string;
}

export const BacktestResults = ({ results, symbol, isPro = false, entryRules = [], exitRules = [], walkForwardResult, startDate, endDate }: BacktestResultsProps) => {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const handleExportPdf = () => {
    if (!isPro) { toast.error("PDF export is a Pro feature. Upgrade to unlock!"); return; }
    exportBacktestToPdf({ ...results, symbol });
    toast.success("PDF exported!");
  };
  const handleExportExcel = () => {
    if (!isPro) { toast.error("Excel export is a Pro feature. Upgrade to unlock!"); return; }
    exportBacktestToExcel({ ...results, symbol });
    toast.success("Excel exported!");
  };

  const isProfitable = results.netPnl > 0;
  const initialCapital = results.initialCapital || (results.finalEquity - results.netPnl);
  const maxDrawdownPercent = initialCapital > 0 ? (results.maxDrawdown / initialCapital) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* ========== SECTION 1: SUMMARY METRICS ========== */}
      <Card className={`border-2 ${isProfitable ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Backtest Result — {symbol}</p>
              <h2 className={`text-3xl font-bold font-heading ${isProfitable ? 'text-success' : 'text-destructive'}`}>
                {isProfitable ? '+' : ''}{formatCurrency(results.netPnl)}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {results.totalTrades} trades · Final equity: {formatCurrency(results.finalEquity)}
              </p>
            </div>
            <div className={`p-4 rounded-full ${isProfitable ? 'bg-success/20' : 'bg-destructive/20'}`}>
              {isProfitable ? <TrendingUp className="h-8 w-8 text-success" /> : <TrendingDown className="h-8 w-8 text-destructive" />}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={handleExportPdf} className="text-xs">
              <FileDown className="h-3.5 w-3.5 mr-1" /> PDF
              {!isPro && <Crown className="h-3 w-3 ml-1 text-accent" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
              {!isPro && <Crown className="h-3 w-3 ml-1 text-accent" />}
            </Button>
            <ShareStrategyButton
              results={results}
              symbol={symbol}
              strategyConfig={{ entry: entryRules, exit: exitRules }}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Return", value: `${results.roi > 0 ? '+' : ''}${results.roi}%`, color: results.roi > 0 ? "text-success" : "text-destructive" },
          { label: "CAGR", value: `${(results.cagr ?? 0).toFixed(1)}%`, color: (results.cagr ?? 0) > 0 ? "text-success" : "text-destructive" },
          { label: "Max Drawdown", value: `${maxDrawdownPercent.toFixed(1)}%`, color: "text-destructive" },
          { label: "Win Rate", value: `${results.winRate}%`, color: results.winRate >= 50 ? "text-success" : "text-warning" },
          { label: "Total Trades", value: results.totalTrades.toString(), color: "text-foreground" },
          { label: "Profit Factor", value: results.profitFactor.toFixed(2), color: results.profitFactor >= 1 ? "text-success" : "text-destructive" },
          { label: "Sharpe Ratio", value: results.sharpeRatio.toFixed(2), color: results.sharpeRatio >= 1 ? "text-success" : "text-warning" },
          { label: "Expectancy", value: formatCurrency(results.expectancy ?? 0), color: (results.expectancy ?? 0) > 0 ? "text-success" : "text-destructive" },
        ].map((m, i) => (
          <div key={i} className="p-3 rounded-lg border border-border bg-card text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{m.label}</p>
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ========== SECTION 2 & 3: CONFIDENCE + HEALTH ========== */}
      <div className="grid md:grid-cols-2 gap-4">
        {results.confidenceScore != null && (
          <ConfidenceScore score={results.confidenceScore} breakdown={results.confidenceBreakdown} />
        )}
        <HealthPanel
          totalTrades={results.totalTrades}
          parameterCount={4}
          winRate={results.winRate}
          maxDrawdownPercent={maxDrawdownPercent}
          profitFactor={results.profitFactor}
          monthlyReturns={results.monthlyReturns}
        />
      </div>

      {/* ========== SECTION 4: EQUITY CURVE ========== */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {(() => {
                const sampled = results.equityCurve.filter((_, i) => i % Math.max(1, Math.floor(results.equityCurve.length / 300)) === 0);
                
                // Determine date range span for dynamic X-axis formatting
                const parseDateLocal = (dateStr: string): Date => {
                  const parts = dateStr.split(/[-/T]/);
                  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) || 1);
                };
                
                const firstDate = sampled.length > 0 ? parseDateLocal(sampled[0].date) : new Date();
                const lastDate = sampled.length > 0 ? parseDateLocal(sampled[sampled.length - 1].date) : new Date();
                const rangeDays = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
                
                const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                
                const formatTick = (dateStr: string): string => {
                  const d = parseDateLocal(dateStr);
                  if (rangeDays > 730) {
                    // Multi-year: show year only
                    return String(d.getFullYear());
                  } else if (rangeDays > 90) {
                    // ~3 months to 2 years: show month + year
                    return `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
                  } else {
                    // Short range: show day + month
                    return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
                  }
                };

                // Calculate appropriate minTickGap based on range
                const minGap = rangeDays > 730 ? 60 : rangeDays > 90 ? 50 : 35;

                return (
                  <AreaChart data={sampled}>
                    <defs>
                      <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProfitable ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isProfitable ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={formatTick}
                      interval="preserveStartEnd"
                      minTickGap={minGap}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} domain={['auto', 'auto']} width={55} />
                    <ReferenceLine y={initialCapital} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Start', position: 'insideTopRight', fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const value = payload[0].value as number;
                        const retPct = ((value - initialCapital) / initialCapital) * 100;
                        const d = parseDateLocal(payload[0].payload.date);
                        const dateLabel = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
                        return (
                          <div className="bg-popover border border-border rounded-lg p-2.5 shadow-lg">
                            <p className="text-xs text-muted-foreground">{dateLabel}</p>
                            <p className="font-medium">{formatCurrency(value)}</p>
                            <p className={`text-xs ${retPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {retPct >= 0 ? '+' : ''}{retPct.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Area type="monotone" dataKey="equity" stroke={isProfitable ? "hsl(var(--success))" : "hsl(var(--destructive))"} strokeWidth={2} fill="url(#eqGrad)" dot={false} animationDuration={800} />
                  </AreaChart>
                );
              })()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 5: MONTHLY RETURNS ========== */}
      {isPro ? (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Monthly Return (Selected Range)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                  const buckets: Record<number, number[]> = {};
                  for (let m = 0; m < 12; m++) buckets[m] = [];
                  results.monthlyReturns.forEach(mr => {
                    const d = new Date(mr.month + "-01");
                    if (!isNaN(d.getTime())) {
                      buckets[d.getMonth()].push(mr.return);
                    }
                  });
                  return MONTH_NAMES.map((name, i) => {
                    const vals = buckets[i];
                    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    return { month: name, return: parseFloat(avg.toFixed(2)) };
                  });
                })()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `${v}%`} tickLine={false} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const v = payload[0].value as number;
                      return (
                        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg">
                          <p className="text-xs text-muted-foreground">{payload[0].payload.month}</p>
                          <p className={`font-medium ${v >= 0 ? 'text-success' : 'text-destructive'}`}>{v >= 0 ? '+' : ''}{v.toFixed(2)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <Cell key={idx} fill={(() => {
                        const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        const buckets: Record<number, number[]> = {};
                        for (let m = 0; m < 12; m++) buckets[m] = [];
                        results.monthlyReturns.forEach(mr => {
                          const d = new Date(mr.month + "-01");
                          if (!isNaN(d.getTime())) buckets[d.getMonth()].push(mr.return);
                        });
                        const vals = buckets[idx];
                        const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                        return avg >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
                      })()} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProLockedSection title="Monthly Returns" description="Upgrade to Pro to view month-by-month P&L breakdown" />
      )}

      {/* ========== SECTION 6: TRADE LOG ========== */}
      {isPro ? (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><List className="h-4 w-4" /> Trade Log</CardTitle>
          </CardHeader>
          <CardContent>
            {results.trades && results.trades.length > 0 ? (
              <TradeTable trades={results.trades} isPro={isPro} />
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No trade data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <ProLockedSection title="Trade Log" description="Upgrade to Pro to view full trade-by-trade analysis" />
      )}

      {/* Walk-Forward */}
      {walkForwardResult && <WalkForwardResults result={walkForwardResult} />}
    </div>
  );
};

/* Reusable Pro locked overlay */
const ProLockedSection = ({ title, description }: { title: string; description: string }) => (
  <Card className="border-border overflow-hidden relative">
    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/60 flex flex-col items-center justify-center gap-3">
      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
        <Crown className="h-6 w-6 text-accent" />
      </div>
      <div className="text-center">
        <p className="font-semibold mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <CardContent className="py-6 opacity-20 pointer-events-none select-none">
      <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted rounded" />)}</div>
    </CardContent>
  </Card>
);
