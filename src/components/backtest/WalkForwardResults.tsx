import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, TrendingUp, TrendingDown, BarChart3, ShieldCheck } from "lucide-react";
import type { WalkForwardResult } from "@/lib/backtest/walkForward";

interface WalkForwardResultsProps {
  result: WalkForwardResult;
}

export const WalkForwardResults = ({ result }: WalkForwardResultsProps) => {
  const formatPercent = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={`border-2 ${result.isRobust ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <h3 className="font-semibold font-heading">Walk-Forward Validation</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {result.windows.length} rolling windows • {result.consistencyScore}% OOS profitable
              </p>
            </div>
            <Badge variant={result.isRobust ? "default" : "destructive"} className="text-sm px-3 py-1">
              {result.isRobust ? "Robust" : "Weak"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Avg IS Return</p>
            <p className={`font-bold ${result.avgInSampleReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercent(result.avgInSampleReturn)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Avg OOS Return</p>
            <p className={`font-bold ${result.avgOutOfSampleReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercent(result.avgOutOfSampleReturn)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Efficiency</p>
            <p className={`font-bold ${result.aggregateEfficiency > 0.5 ? 'text-success' : 'text-warning'}`}>
              {result.aggregateEfficiency.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">OOS Consistency</p>
            <p className={`font-bold ${result.consistencyScore >= 50 ? 'text-success' : 'text-destructive'}`}>
              {result.consistencyScore}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Window Details Table */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            Window Breakdown
          </CardTitle>
          <CardDescription className="text-xs">In-Sample (training) vs Out-of-Sample (testing) performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground">Window</th>
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground">IS Period</th>
                  <th className="text-right py-2 px-2 text-xs text-muted-foreground">IS ROI</th>
                  <th className="text-left py-2 px-2 text-xs text-muted-foreground">OOS Period</th>
                  <th className="text-right py-2 px-2 text-xs text-muted-foreground">OOS ROI</th>
                  <th className="text-right py-2 px-2 text-xs text-muted-foreground">Efficiency</th>
                  <th className="text-center py-2 px-2 text-xs text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.windows.map((w) => (
                  <tr key={w.windowNumber} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">W{w.windowNumber}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {w.inSampleStart} → {w.inSampleEnd}
                    </td>
                    <td className={`py-2 px-2 text-right font-medium ${w.inSampleResults.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatPercent(w.inSampleResults.roi)}
                    </td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {w.outOfSampleStart} → {w.outOfSampleEnd}
                    </td>
                    <td className={`py-2 px-2 text-right font-medium ${w.outOfSampleResults.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatPercent(w.outOfSampleResults.roi)}
                    </td>
                    <td className={`py-2 px-2 text-right ${w.efficiency > 0.5 ? 'text-success' : 'text-warning'}`}>
                      {w.efficiency.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {w.outOfSampleResults.netPnl > 0 ? (
                        <CheckCircle className="h-4 w-4 text-success inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interpretation */}
      <Card className="border-border bg-muted/30">
        <CardContent className="py-4">
          <h4 className="text-sm font-medium mb-2">📊 Interpretation</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>Efficiency &gt; 0.5</strong>: Strategy retains most performance on unseen data (good)</li>
            <li>• <strong>OOS Consistency ≥ 75%</strong>: Strategy is consistently profitable across periods</li>
            <li>• <strong>High IS, Low OOS</strong>: Possible overfitting — strategy memorizes patterns instead of learning</li>
            {result.isRobust ? (
              <li className="text-success">✅ This strategy shows robust out-of-sample performance</li>
            ) : (
              <li className="text-warning">⚠️ Strategy may be overfit — consider simplifying rules or using more data</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
