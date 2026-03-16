import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Activity, BarChart3, TrendingDown } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface HealthPanelProps {
  totalTrades: number;
  parameterCount: number;
  winRate: number;
  maxDrawdownPercent: number;
  profitFactor: number;
  monthlyReturns: Array<{ month: string; return: number }>;
}

export const HealthPanel = ({
  totalTrades, parameterCount, winRate, maxDrawdownPercent, profitFactor, monthlyReturns,
}: HealthPanelProps) => {
  // Overfit Risk: high params relative to trades
  const overfitRatio = parameterCount > 0 ? totalTrades / parameterCount : 100;
  const overfitRisk = overfitRatio < 5 ? "High" : overfitRatio < 15 ? "Medium" : "Low";
  const overfitColor = overfitRisk === "Low" ? "text-success" : overfitRisk === "Medium" ? "text-warning" : "text-destructive";

  // Regime Sensitivity: variance in monthly returns
  const returnValues = monthlyReturns.map(m => m.return);
  const mean = returnValues.length > 0 ? returnValues.reduce((a, b) => a + b, 0) / returnValues.length : 0;
  const variance = returnValues.length > 1 ? returnValues.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / returnValues.length : 0;
  const regimeSensitivity = Math.sqrt(variance);
  const regimeLabel = regimeSensitivity < 3 ? "Stable" : regimeSensitivity < 8 ? "Moderate" : "Sensitive";
  const regimeColor = regimeLabel === "Stable" ? "text-success" : regimeLabel === "Moderate" ? "text-warning" : "text-destructive";

  // Trade Distribution: how balanced wins/losses are
  const balanceScore = winRate >= 35 && winRate <= 75 ? "Balanced" : "Skewed";
  const balanceColor = balanceScore === "Balanced" ? "text-success" : "text-warning";

  // Drawdown severity
  const ddLabel = maxDrawdownPercent <= 10 ? "Healthy" : maxDrawdownPercent <= 25 ? "Moderate" : "Severe";
  const ddColor = ddLabel === "Healthy" ? "text-success" : ddLabel === "Moderate" ? "text-warning" : "text-destructive";

  const items = [
    { label: "Overfit Risk", value: overfitRisk, detail: `${totalTrades} trades / ${parameterCount} params`, color: overfitColor, icon: AlertTriangle, tooltip: "Risk of strategy being over-optimized to historical data." },
    { label: "Regime Sensitivity", value: regimeLabel, detail: `σ = ${regimeSensitivity.toFixed(1)}%`, color: regimeColor, icon: Activity, tooltip: "How much performance varies across different time periods." },
    { label: "Trade Distribution", value: balanceScore, detail: `${winRate}% win rate`, color: balanceColor, icon: BarChart3, tooltip: "A balanced distribution (35-75% wins) is more reliable." },
    { label: "Drawdown Severity", value: ddLabel, detail: `${maxDrawdownPercent.toFixed(1)}% max`, color: ddColor, icon: TrendingDown, tooltip: "Peak-to-trough decline severity." },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          Strategy Health
          <InfoTooltip content="Diagnostic panel showing potential risks and reliability indicators for this strategy." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center gap-1">
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <InfoTooltip content={item.tooltip} />
              </div>
              <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
