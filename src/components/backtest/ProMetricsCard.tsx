import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, TrendingDown, Activity, BarChart3, Gauge } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ProMetricsCardProps {
  isPro: boolean;
  sharpeRatio: number;
  sortinoRatio?: number;
  maxDrawdown: number;
  profitFactor: number;
  calmarRatio?: number;
  expectancy?: number;
  cagr?: number;
  recoveryFactor?: number;
}

export const ProMetricsCard = ({
  isPro,
  sharpeRatio,
  sortinoRatio = 0,
  maxDrawdown,
  profitFactor,
  calmarRatio = 0,
  expectancy = 0,
  cagr = 0,
  recoveryFactor = 0,
}: ProMetricsCardProps) => {

  const metrics = [
    {
      label: "Sharpe Ratio",
      value: sharpeRatio.toFixed(2),
      icon: Activity,
      color: sharpeRatio >= 1 ? "text-success" : sharpeRatio >= 0.5 ? "text-warning" : "text-destructive",
      tooltip: "Risk-adjusted return. Above 1 is good, above 2 is excellent.",
    },
    {
      label: "Sortino Ratio",
      value: sortinoRatio.toFixed(2),
      icon: Gauge,
      color: sortinoRatio >= 1.5 ? "text-success" : sortinoRatio >= 1 ? "text-warning" : "text-muted-foreground",
      tooltip: "Like Sharpe but only penalizes downside volatility. Higher is better.",
    },
    {
      label: "Max Drawdown",
      value: `${maxDrawdown.toFixed(1)}%`,
      icon: TrendingDown,
      color: maxDrawdown <= 10 ? "text-success" : maxDrawdown <= 20 ? "text-warning" : "text-destructive",
      tooltip: "Largest peak-to-trough decline. Lower is better.",
    },
    {
      label: "Profit Factor",
      value: profitFactor.toFixed(2),
      icon: BarChart3,
      color: profitFactor >= 1.5 ? "text-success" : profitFactor >= 1 ? "text-warning" : "text-destructive",
      tooltip: "Gross profit divided by gross loss. Above 1.5 is good.",
    },
    {
      label: "Expectancy",
      value: `₹${expectancy.toLocaleString()}`,
      icon: BarChart3,
      color: expectancy > 0 ? "text-success" : "text-destructive",
      tooltip: "Average amount you can expect to win/lose per trade.",
    },
    {
      label: "CAGR",
      value: `${cagr.toFixed(1)}%`,
      icon: Activity,
      color: cagr > 10 ? "text-success" : cagr > 0 ? "text-warning" : "text-destructive",
      tooltip: "Compound Annual Growth Rate. Annualized return of the strategy.",
    },
    {
      label: "Recovery Factor",
      value: recoveryFactor.toFixed(2),
      icon: Gauge,
      color: recoveryFactor > 2 ? "text-success" : recoveryFactor > 1 ? "text-warning" : "text-destructive",
      tooltip: "Net profit divided by max drawdown. Above 2 is good.",
    },
    {
      label: "Calmar Ratio",
      value: calmarRatio.toFixed(2),
      icon: Gauge,
      color: calmarRatio >= 1 ? "text-success" : calmarRatio >= 0.5 ? "text-warning" : "text-destructive",
      tooltip: "Return vs drawdown ratio. Above 1 is excellent.",
    },
  ];

  if (!isPro) {
    return (
      <Card className="border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Advanced metrics available with PRO
          </p>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Advanced Metrics
            <Badge variant="outline" className="text-xs gap-1 ml-auto">
              <Crown className="h-3 w-3" />
              PRO
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 opacity-30">
            {metrics.map((metric, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-semibold">--</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          Advanced Metrics
          <Badge variant="secondary" className="text-xs gap-1 ml-auto bg-accent/10 text-accent">
            <Crown className="h-3 w-3" />
            PRO
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1">
                <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <InfoTooltip content={metric.tooltip} />
              </div>
              <p className={`text-lg font-semibold ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
