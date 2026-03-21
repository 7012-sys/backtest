import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISummaryProps {
  metrics: {
    netPnl: number;
    roi: number;
    cagr?: number;
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
    sortinoRatio?: number;
    expectancy?: number;
  };
  symbol: string;
  entryRules?: any[];
  exitRules?: any[];
  isPro: boolean;
}

export const AISummary = ({ metrics, symbol, entryRules, exitRules, isPro }: AISummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("backtest-summary", {
        body: { metrics, symbol, entryRules, exitRules },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary);
    } catch (err: any) {
      console.error("AI summary error:", err);
      toast.error(err.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <Card className="border-border overflow-hidden relative">
        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-background/60 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
            <Crown className="h-5 w-5 text-accent" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm mb-0.5">AI Strategy Summary</p>
            <p className="text-xs text-muted-foreground">Upgrade to Pro for AI-powered analysis</p>
          </div>
        </div>
        <CardContent className="py-5 opacity-20 pointer-events-none select-none">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold">AI Strategy Summary</p>
        </div>

        {summary ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={generateSummary}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1.5" />
                Generate AI Summary
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
