import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, TrendingUp, TrendingDown, Activity, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Trade {
  id: string;
  entryDate: string;
  exitDate: string;
  pnl: number;
  pnlPercent: number;
  side: "long" | "short";
  holdingDays: number;
}

interface AdvancedInsightsProps {
  results: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    netPnl: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
    sortinoRatio?: number;
    calmarRatio?: number;
    avgWin: number;
    avgLoss: number;
    trades?: Trade[];
    monthlyReturns: Array<{ month: string; return: number }>;
    initialCapital?: number;
    finalEquity: number;
    recoveryFactor?: number;
    expectancy?: number;
  };
  isPro: boolean;
}

export const AdvancedInsights = ({ results, isPro }: AdvancedInsightsProps) => {
  if (!isPro) {
    return (
      <Card className="border-border overflow-hidden relative">
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/60 flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Crown className="h-6 w-6 text-accent" />
          </div>
          <div className="text-center">
            <p className="font-semibold mb-1">Advanced Insights</p>
            <p className="text-sm text-muted-foreground">Upgrade to Pro to unlock detailed trade analysis</p>
          </div>
          <Link to="/upgrade">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Crown className="h-3.5 w-3.5 mr-1" /> Upgrade to Pro
            </Button>
          </Link>
        </div>
        <CardContent className="py-6 opacity-20 pointer-events-none select-none">
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-8 bg-muted rounded" />)}</div>
        </CardContent>
      </Card>
    );
  }

  const trades = results.trades || [];
  const initialCapital = results.initialCapital || (results.finalEquity - results.netPnl);
  const maxDDPercent = initialCapital > 0 ? (results.maxDrawdown / initialCapital) * 100 : 0;

  // Trade streaks
  let maxWinStreak = 0, maxLoseStreak = 0, curWin = 0, curLose = 0;
  trades.forEach(t => {
    if (t.pnl > 0) { curWin++; curLose = 0; maxWinStreak = Math.max(maxWinStreak, curWin); }
    else { curLose++; curWin = 0; maxLoseStreak = Math.max(maxLoseStreak, curLose); }
  });

  // Best & worst trades
  const sorted = [...trades].sort((a, b) => b.pnl - a.pnl);
  const bestTrade = sorted[0];
  const worstTrade = sorted[sorted.length - 1];

  // Monthly returns aggregation
  const monthlyMap = new Map<string, number>();
  results.monthlyReturns.forEach(mr => monthlyMap.set(mr.month, mr.return));
  const yearlyReturns = new Map<string, number[]>();
  results.monthlyReturns.forEach(mr => {
    const year = mr.month.split("-")[0];
    if (!yearlyReturns.has(year)) yearlyReturns.set(year, []);
    yearlyReturns.get(year)!.push(mr.return);
  });

  const formatCurrency = (v: number) => {
    if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" /> Advanced Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trade Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Win Streak", value: maxWinStreak.toString(), icon: TrendingUp, color: "text-success" },
            { label: "Lose Streak", value: maxLoseStreak.toString(), icon: TrendingDown, color: "text-destructive" },
            { label: "Avg Win", value: formatCurrency(results.avgWin), icon: TrendingUp, color: "text-success" },
            { label: "Avg Loss", value: formatCurrency(Math.abs(results.avgLoss)), icon: TrendingDown, color: "text-destructive" },
          ].map((m, i) => (
            <div key={i} className="p-2.5 rounded-lg border border-border text-center">
              <m.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${m.color}`} />
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Risk Metrics */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Risk Metrics</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Sharpe Ratio", value: results.sharpeRatio.toFixed(2) },
              { label: "Sortino Ratio", value: (results.sortinoRatio || 0).toFixed(2) },
              { label: "Calmar Ratio", value: (results.calmarRatio || 0).toFixed(2) },
              { label: "Recovery Factor", value: (results.recoveryFactor || 0).toFixed(2) },
            ].map((m, i) => (
              <div key={i} className="p-2 rounded border border-border text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Best & Worst Trades */}
        {bestTrade && worstTrade && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-success/30 bg-success/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3.5 w-3.5 text-success" />
                <p className="text-xs font-semibold text-success">Best Trade</p>
              </div>
              <p className="text-lg font-bold text-success">{formatCurrency(bestTrade.pnl)}</p>
              <p className="text-[10px] text-muted-foreground">
                {bestTrade.side.toUpperCase()} · {bestTrade.entryDate?.split("T")[0]} → {bestTrade.exitDate?.split("T")[0]}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs font-semibold text-destructive">Worst Trade</p>
              </div>
              <p className="text-lg font-bold text-destructive">{formatCurrency(worstTrade.pnl)}</p>
              <p className="text-[10px] text-muted-foreground">
                {worstTrade.side.toUpperCase()} · {worstTrade.entryDate?.split("T")[0]} → {worstTrade.exitDate?.split("T")[0]}
              </p>
            </div>
          </div>
        )}

        {/* Yearly Returns */}
        {yearlyReturns.size > 1 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Yearly Returns</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from(yearlyReturns.entries()).map(([year, rets]) => {
                const total = rets.reduce((a, b) => a + b, 0);
                return (
                  <div key={year} className="p-2 rounded border border-border text-center">
                    <p className="text-[10px] text-muted-foreground">{year}</p>
                    <p className={`text-sm font-bold ${total >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {total >= 0 ? '+' : ''}{total.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Drawdown Analysis */}
        <div className="p-3 rounded-lg border border-border bg-muted/20">
          <p className="text-xs font-semibold mb-2">Drawdown Analysis</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Max Drawdown</p>
              <p className="text-sm font-bold text-destructive">{maxDDPercent.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Abs Drawdown</p>
              <p className="text-sm font-bold text-destructive">{formatCurrency(results.maxDrawdown)}</p>
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground uppercase">Expectancy</p>
              <p className={`text-sm font-bold ${(results.expectancy || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(results.expectancy || 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
