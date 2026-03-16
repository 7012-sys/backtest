import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, BarChart3, Eye } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface BacktestHistoryProps {
  strategyId: string;
}

export const BacktestHistory = ({ strategyId }: BacktestHistoryProps) => {
  const navigate = useNavigate();

  const { data: backtests = [], isLoading } = useQuery({
    queryKey: ["strategy-backtests", strategyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backtests")
        .select("id, symbol, timeframe, start_date, end_date, created_at, win_rate, net_pnl, total_trades, initial_capital, profit_factor, max_drawdown")
        .eq("strategy_id", strategyId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!strategyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (backtests.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-medium text-sm mb-1">No backtests yet</h3>
          <p className="text-xs text-muted-foreground">Run a backtest on this strategy to see results here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {backtests.map((bt) => {
        const isProfit = (bt.net_pnl ?? 0) >= 0;
        const returnPct = bt.initial_capital > 0
          ? ((bt.net_pnl ?? 0) / bt.initial_capital * 100).toFixed(1)
          : "0.0";

        return (
          <Card
            key={bt.id}
            className="border-border hover:bg-muted/30 transition-colors cursor-pointer group"
            onClick={() => navigate(`/backtest/${bt.id}`)}
          >
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-sm text-foreground">{bt.symbol}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">{bt.timeframe}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(bt.start_date), "MMM d, yy")} → {format(new Date(bt.end_date), "MMM d, yy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{format(new Date(bt.created_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Trades:</span>
                      <span className="font-medium">{bt.total_trades ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Win Rate:</span>
                      <span className="font-medium">{(bt.win_rate ?? 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`flex items-center gap-1 text-sm font-semibold ${isProfit ? "text-emerald-500" : "text-destructive"}`}>
                      {isProfit ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      ₹{Math.abs(bt.net_pnl ?? 0).toLocaleString()}
                    </div>
                    <span className={`text-xs ${isProfit ? "text-emerald-500/70" : "text-destructive/70"}`}>
                      {isProfit ? "+" : "-"}{Math.abs(Number(returnPct))}%
                    </span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
