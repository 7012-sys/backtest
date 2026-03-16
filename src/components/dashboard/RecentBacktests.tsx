import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Backtest {
  id: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  net_pnl: number | null;
  win_rate: number | null;
  total_trades: number | null;
  max_drawdown: number | null;
  created_at: string;
  strategy?: {
    name: string;
  };
}

interface RecentBacktestsProps {
  backtests: Backtest[];
  loading?: boolean;
}

export const RecentBacktests = ({ backtests, loading }: RecentBacktestsProps) => {
  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Recent Backtests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!backtests || backtests.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Recent Backtests
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No backtests yet</p>
            <p className="text-xs mt-1">Run your first backtest to see results here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Recent Backtests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {backtests.slice(0, 5).map((backtest) => {
            const isProfit = (backtest.net_pnl ?? 0) >= 0;
            const returnPercent = backtest.initial_capital > 0 
              ? ((backtest.net_pnl ?? 0) / backtest.initial_capital * 100).toFixed(1)
              : "0";
            
            return (
              <div 
                key={backtest.id}
                className="p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {backtest.symbol}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{backtest.timeframe}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${isProfit ? "text-success" : "text-destructive"}`}>
                    {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {isProfit ? "+" : ""}{returnPercent}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>Win: <span className="text-foreground">{backtest.win_rate?.toFixed(1) ?? 0}%</span></span>
                    <span>Trades: <span className="text-foreground">{backtest.total_trades ?? 0}</span></span>
                    {backtest.max_drawdown && (
                      <span>DD: <span className="text-destructive">{backtest.max_drawdown.toFixed(1)}%</span></span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(backtest.created_at), "MMM d")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
