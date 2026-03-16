import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { GitCompare, Lock, Plus, X, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
}

interface BacktestResult {
  strategy_id: string;
  strategy_name: string;
  net_pnl: number;
  win_rate: number;
  total_trades: number;
  profit_factor: number;
  max_drawdown: number;
}

const StrategyComparison = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<BacktestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isPro, isLoading: subLoading } = useSubscription(userId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      fetchStrategies(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchStrategies = async (uid: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("strategies")
      .select("id, name, description")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching strategies:", error);
      toast.error("Failed to load strategies");
    } else {
      setStrategies(data || []);
    }
    setIsLoading(false);
  };

  const toggleStrategy = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(s => s !== id));
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id]);
    } else {
      toast.error("Maximum 5 strategies can be compared");
    }
  };

  const runComparison = async () => {
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 strategies to compare");
      return;
    }

    setIsLoading(true);
    const results: BacktestResult[] = [];

    for (const strategyId of selectedIds) {
      const { data: backtests } = await supabase
        .from("backtests")
        .select("*")
        .eq("strategy_id", strategyId)
        .order("created_at", { ascending: false })
        .limit(1);

      const strategy = strategies.find(s => s.id === strategyId);
      if (backtests && backtests.length > 0) {
        const bt = backtests[0];
        results.push({
          strategy_id: strategyId,
          strategy_name: strategy?.name || "Unknown",
          net_pnl: bt.net_pnl || 0,
          win_rate: bt.win_rate || 0,
          total_trades: bt.total_trades || 0,
          profit_factor: bt.profit_factor || 0,
          max_drawdown: bt.max_drawdown || 0,
        });
      } else {
        results.push({
          strategy_id: strategyId,
          strategy_name: strategy?.name || "Unknown",
          net_pnl: 0,
          win_rate: 0,
          total_trades: 0,
          profit_factor: 0,
          max_drawdown: 0,
        });
      }
    }

    setComparisonResults(results);
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // PRO-only gate
  if (!subLoading && !isPro) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader 
          onSignOut={handleSignOut}
          rightContent={<ThemeToggle />}
        />
        <main className="flex-1 container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-foreground mb-4">
              PRO Feature
            </h1>
            <p className="text-muted-foreground mb-8">
              Strategy Comparison is a PRO-only feature. Compare up to 5 strategies side-by-side with detailed metrics and charts.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the Upgrade to Pro button in the header to unlock this feature.
            </p>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader 
        onSignOut={handleSignOut}
        rightContent={<ThemeToggle />}
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-heading text-foreground">Strategy Comparison</h1>
              <p className="text-muted-foreground mt-1">
                Compare up to 5 strategies side-by-side
              </p>
            </div>
            <Button
              onClick={runComparison}
              disabled={selectedIds.length < 2 || isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare ({selectedIds.length}/5)
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Strategy Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Select Strategies</CardTitle>
                <CardDescription>Choose 2-5 strategies to compare</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                  </div>
                ) : strategies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No strategies found</p>
                    <Button onClick={() => navigate("/strategy-builder")} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Strategy
                    </Button>
                  </div>
                ) : (
                  strategies.map((strategy) => (
                    <button
                      key={strategy.id}
                      onClick={() => toggleStrategy(strategy.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedIds.includes(strategy.id)
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{strategy.name}</span>
                        {selectedIds.includes(strategy.id) && (
                          <X className="h-4 w-4 text-accent" />
                        )}
                      </div>
                      {strategy.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {strategy.description}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Comparison Results */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  Comparison Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparisonResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No comparison yet</h3>
                    <p className="text-muted-foreground">
                      Select at least 2 strategies and click Compare
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Strategy</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Net P&L</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Win Rate</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Trades</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Profit Factor</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Max DD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonResults.map((result, idx) => (
                          <tr key={result.strategy_id} className="border-b border-border/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: `hsl(${idx * 60}, 70%, 50%)` }}
                                />
                                <span className="font-medium text-foreground">{result.strategy_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={result.net_pnl >= 0 ? "text-success" : "text-destructive"}>
                                {result.net_pnl >= 0 ? "+" : ""}₹{result.net_pnl.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-foreground">{result.win_rate.toFixed(1)}%</span>
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground">
                              {result.total_trades}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={result.profit_factor >= 1 ? "text-success" : "text-destructive"}>
                                {result.profit_factor.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-destructive">
                              -₹{Math.abs(result.max_drawdown).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {comparisonResults.length > 0 && (() => {
                        const best = comparisonResults.reduce((a, b) => a.net_pnl > b.net_pnl ? a : b);
                        const highest_wr = comparisonResults.reduce((a, b) => a.win_rate > b.win_rate ? a : b);
                        const lowest_dd = comparisonResults.reduce((a, b) => a.max_drawdown < b.max_drawdown ? a : b);
                        
                        return (
                          <>
                            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-success" />
                                <span className="text-sm font-medium text-success">Best P&L</span>
                              </div>
                              <p className="font-semibold text-foreground">{best.strategy_name}</p>
                              <p className="text-sm text-success">+₹{best.net_pnl.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-4 w-4 text-accent" />
                                <span className="text-sm font-medium text-accent">Highest Win Rate</span>
                              </div>
                              <p className="font-semibold text-foreground">{highest_wr.strategy_name}</p>
                              <p className="text-sm text-accent">{highest_wr.win_rate.toFixed(1)}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted border border-border">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Lowest Drawdown</span>
                              </div>
                              <p className="font-semibold text-foreground">{lowest_dd.strategy_name}</p>
                              <p className="text-sm text-muted-foreground">-₹{Math.abs(lowest_dd.max_drawdown).toLocaleString()}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default StrategyComparison;
