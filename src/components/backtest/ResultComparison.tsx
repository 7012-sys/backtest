import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus, GitCompare } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ResultComparisonProps {
  current: {
    roi: number;
    winRate: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    netPnl: number;
    profitFactor: number;
  };
  previous: {
    roi: number;
    winRate: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    netPnl: number;
    profitFactor: number;
  } | null;
}

export const ResultComparison = ({ current, previous }: ResultComparisonProps) => {
  if (!previous) {
    return (
      <Card className="border-border">
        <CardContent className="py-6 text-center">
          <GitCompare className="h-6 w-6 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No previous backtest to compare against</p>
        </CardContent>
      </Card>
    );
  }

  const delta = (curr: number, prev: number) => curr - prev;
  const DeltaIcon = ({ d, invert }: { d: number; invert?: boolean }) => {
    const isGood = invert ? d < 0 : d > 0;
    if (Math.abs(d) < 0.01) return <Minus className="h-3 w-3 text-muted-foreground" />;
    return isGood ? <ArrowUp className="h-3 w-3 text-success" /> : <ArrowDown className="h-3 w-3 text-destructive" />;
  };
  const fmt = (d: number) => (d >= 0 ? "+" : "") + d.toFixed(2);

  const comparisons = [
    { label: "ROI", curr: current.roi, prev: previous.roi, suffix: "%", invert: false },
    { label: "Win Rate", curr: current.winRate, prev: previous.winRate, suffix: "%", invert: false },
    { label: "Max DD", curr: current.maxDrawdownPercent, prev: previous.maxDrawdownPercent, suffix: "%", invert: true },
    { label: "Sharpe", curr: current.sharpeRatio, prev: previous.sharpeRatio, suffix: "", invert: false },
    { label: "Profit Factor", curr: current.profitFactor, prev: previous.profitFactor, suffix: "", invert: false },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-accent" />
          vs Previous Backtest
          <InfoTooltip content="Compares this backtest result against the most recent previous backtest for the same strategy." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {comparisons.map((c) => {
            const d = delta(c.curr, c.prev);
            return (
              <div key={c.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.curr.toFixed(2)}{c.suffix}</span>
                  <div className="flex items-center gap-0.5">
                    <DeltaIcon d={d} invert={c.invert} />
                    <span className={`text-xs ${(c.invert ? d < 0 : d > 0) ? "text-success" : Math.abs(d) < 0.01 ? "text-muted-foreground" : "text-destructive"}`}>
                      {fmt(d)}{c.suffix}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
