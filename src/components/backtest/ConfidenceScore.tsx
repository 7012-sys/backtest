import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingUp, BarChart3, Activity, AlertTriangle } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface ConfidenceScoreProps {
  score: number;
  breakdown?: {
    tradeCountScore: number;
    sampleSizeScore: number;
    consistencyScore: number;
    drawdownRecoveryScore: number;
    overfitRiskScore: number;
  };
}

export const ConfidenceScore = ({ score, breakdown }: ConfidenceScoreProps) => {
  const getColor = (s: number) => s >= 70 ? "text-success" : s >= 40 ? "text-warning" : "text-destructive";
  const getBg = (s: number) => s >= 70 ? "bg-success" : s >= 40 ? "bg-warning" : "bg-destructive";
  const getLabel = (s: number) => s >= 70 ? "High Confidence" : s >= 40 ? "Moderate" : "Low Confidence";

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className={`h-4 w-4 ${getColor(score)}`} />
          Confidence Score
          <InfoTooltip content="Measures how statistically reliable this backtest result is, based on trade count, consistency, and overfit risk." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={`hsl(var(--${score >= 70 ? 'success' : score >= 40 ? 'warning' : 'destructive'}))`} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${getColor(score)}`}>{score}</span>
            </div>
          </div>
          <div>
            <p className={`font-semibold ${getColor(score)}`}>{getLabel(score)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {score >= 70 ? "Results are statistically meaningful" : score >= 40 ? "Consider more trades for better reliability" : "Insufficient data for reliable conclusions"}
            </p>
          </div>
        </div>

        {breakdown && (
          <div className="space-y-2">
            {[
              { label: "Trade Count", value: breakdown.tradeCountScore, max: 25, icon: BarChart3 },
              { label: "Sample Quality", value: breakdown.sampleSizeScore, max: 20, icon: Activity },
              { label: "Consistency", value: breakdown.consistencyScore, max: 25, icon: TrendingUp },
              { label: "Recovery", value: breakdown.drawdownRecoveryScore, max: 15, icon: TrendingUp },
              { label: "Overfit Safety", value: breakdown.overfitRiskScore, max: 15, icon: AlertTriangle },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-24 shrink-0">{item.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getBg(item.value / item.max * 100)}`} style={{ width: `${(item.value / item.max) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-8 text-right">{item.value}/{item.max}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
