import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareStrategyButtonProps {
  results: any;
  symbol: string;
  strategyConfig?: any;
  startDate?: string;
  endDate?: string;
}

export const ShareStrategyButton = ({ results, symbol, strategyConfig, startDate, endDate }: ShareStrategyButtonProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (!name.trim()) {
      toast.error("Please enter a strategy name");
      return;
    }

    setSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const initialCapital = results.initialCapital || (results.finalEquity - results.netPnl);
      const maxDrawdownPercent = initialCapital > 0 ? (results.maxDrawdown / initialCapital) * 100 : 0;

      const { error } = await supabase.from("community_strategies").insert({
        user_id: user.id,
        strategy_name: name.trim(),
        strategy_config: strategyConfig || {},
        dataset_used: symbol,
        date_range_start: startDate || null,
        date_range_end: endDate || null,
        performance_metrics: {
          netPnl: results.netPnl,
          roi: results.roi,
          cagr: results.cagr || 0,
          winRate: results.winRate,
          totalTrades: results.totalTrades,
          profitFactor: results.profitFactor,
          sharpeRatio: results.sharpeRatio,
          maxDrawdownPercent,
          initialCapital,
        },
        equity_curve: (results.equityCurve || []).filter((_: any, i: number) =>
          i % Math.max(1, Math.floor((results.equityCurve?.length || 1) / 200)) === 0
        ),
        visibility: "public",
      } as any);

      if (error) throw error;

      setShared(true);
      toast.success("Strategy shared with the community!");
      setTimeout(() => { setOpen(false); setShared(false); setName(""); }, 1500);
    } catch (err: any) {
      console.error("Share error:", err);
      toast.error(err.message || "Failed to share strategy");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Share2 className="h-3.5 w-3.5 mr-1" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share Strategy</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your strategy with the community. Other traders can view and apply it to their backtests.
          </p>
          <Input
            placeholder="Give your strategy a name..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
          />
          <Button
            onClick={handleShare}
            disabled={sharing || shared}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {shared ? (
              <><CheckCircle2 className="h-4 w-4 mr-2" /> Shared!</>
            ) : sharing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sharing...</>
            ) : (
              <><Share2 className="h-4 w-4 mr-2" /> Share with Community</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
