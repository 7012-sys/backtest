import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, TrendingDown, Calendar, ThumbsUp, Trash2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Props {
  strategy: {
    id: string;
    strategy_name: string;
    strategy_config: any;
    dataset_used: string;
    date_range_start: string | null;
    date_range_end: string | null;
    performance_metrics: any;
    equity_curve: any;
    created_at: string;
  };
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  likeCount?: number;
  isLiked?: boolean;
  onToggleLike?: () => void;
  isLiking?: boolean;
  isAdmin?: boolean;
  onAdminDelete?: () => void;
}

export const CommunityStrategyDetail = ({ strategy, open, onClose, onApply, likeCount = 0, isLiked = false, onToggleLike, isLiking = false, isAdmin = false, onAdminDelete }: Props) => {
  const metrics = strategy.performance_metrics || {};
  const curve = Array.isArray(strategy.equity_curve) ? strategy.equity_curve : [];
  const isProfitable = (metrics.netPnl || 0) > 0;
  const initialCapital = metrics.initialCapital || (curve.length > 0 ? curve[0]?.equity : 100000);

  const formatCurrency = (v: number) => {
    if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    return `₹${v.toLocaleString("en-IN")}`;
  };

  const getRules = (rules: any[] | undefined, label: string) => {
    if (!rules || rules.length === 0) return null;
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <div className="space-y-1">
          {rules.map((r: any, i: number) => (
            <Badge key={i} variant="secondary" className="text-[10px] mr-1">
              {r.indicator} {r.condition} {typeof r.value === "object" ? JSON.stringify(r.value) : r.value}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${isProfitable ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {isProfitable ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
              </div>
              {strategy.strategy_name}
            </DialogTitle>
            {onToggleLike && (
              <button
                onClick={onToggleLike}
                disabled={isLiking}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full transition-colors ${
                  isLiked
                    ? 'bg-accent/15 text-accent'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Net P&L", value: formatCurrency(metrics.netPnl || 0), color: (metrics.netPnl || 0) >= 0 ? "text-success" : "text-destructive" },
              { label: "CAGR", value: `${(metrics.cagr || 0).toFixed(1)}%`, color: (metrics.cagr || 0) >= 0 ? "text-success" : "text-destructive" },
              { label: "Win Rate", value: `${(metrics.winRate || 0).toFixed(0)}%`, color: (metrics.winRate || 0) >= 50 ? "text-success" : "text-warning" },
              { label: "Sharpe", value: (metrics.sharpeRatio || 0).toFixed(2), color: (metrics.sharpeRatio || 0) >= 1 ? "text-success" : "text-warning" },
              { label: "Drawdown", value: `${(metrics.maxDrawdownPercent || 0).toFixed(1)}%`, color: "text-destructive" },
              { label: "Profit Factor", value: (metrics.profitFactor || 0).toFixed(2), color: (metrics.profitFactor || 0) >= 1 ? "text-success" : "text-destructive" },
              { label: "Total Trades", value: String(metrics.totalTrades || 0), color: "text-foreground" },
              { label: "ROI", value: `${(metrics.roi || 0).toFixed(1)}%`, color: (metrics.roi || 0) >= 0 ? "text-success" : "text-destructive" },
            ].map((m, i) => (
              <div key={i} className="p-2 rounded border border-border text-center">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Equity Curve */}
          {curve.length > 0 && (
            <div className="h-48 border border-border rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curve.filter((_: any, i: number) => i % Math.max(1, Math.floor(curve.length / 200)) === 0)}>
                  <defs>
                    <linearGradient id="communityEqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isProfitable ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isProfitable ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} interval="preserveStartEnd" minTickGap={50} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tickLine={false} width={45} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const v = payload[0].value as number;
                      return (
                        <div className="bg-popover border border-border rounded p-2 shadow-lg text-xs">
                          <p className="text-muted-foreground">{payload[0].payload.date}</p>
                          <p className="font-medium">{formatCurrency(v)}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Area type="monotone" dataKey="equity" stroke={isProfitable ? "hsl(var(--success))" : "hsl(var(--destructive))"} strokeWidth={1.5} fill="url(#communityEqGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Strategy Config */}
          <div className="space-y-2">
            <p className="text-xs font-semibold">Strategy Configuration</p>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Dataset: {strategy.dataset_used}
              {strategy.date_range_start && strategy.date_range_end && (
                <span> · {strategy.date_range_start} to {strategy.date_range_end}</span>
              )}
            </div>
            {getRules(strategy.strategy_config?.entry, "Entry Rules")}
            {getRules(strategy.strategy_config?.exit, "Exit Rules")}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={onApply} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <Play className="h-4 w-4 mr-2" /> Apply Strategy to Backtest
            </Button>
            {isAdmin && onAdminDelete && (
              <Button variant="destructive" onClick={onAdminDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
