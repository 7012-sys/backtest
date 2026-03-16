import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  BarChart3,
  Sparkles,
  ChevronRight,
  Crown,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  FlaskConical,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { UsageProgressBar } from "@/components/dashboard/UsageProgressBar";
import { StrategyList } from "@/components/dashboard/StrategyList";
import { toast } from "sonner";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const checkUserAccess = async (user: User) => {
      if (!user.email_confirmed_at) {
        navigate("/auth", { state: { showVerification: true, email: user.email } });
        return false;
      }
      return true;
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      } else {
        setTimeout(() => checkUserAccess(session.user), 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkUserAccess(session.user);
      }
    });

    return () => authSub.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      // Auto-downgrade expired pro subscriptions
      if (
        data.plan !== "free" &&
        data.current_period_end &&
        new Date(data.current_period_end) < new Date()
      ) {
        await supabase
          .from("subscriptions")
          .update({ plan: "free", status: "expired" })
          .eq("user_id", user.id);
        setSubscription({ plan: "free", status: "expired", current_period_end: data.current_period_end });
        toast.info("Your Pro plan has expired. You've been moved to the Free plan.");
      } else {
        setSubscription(data);
      }
    }
  };

  const { strategies, backtests, isLoading: dataLoading } = useDashboardData(user?.id);
  const {
    monthlyBacktestsUsed,
    backtestLimit,
    canRunBacktest,
    canUseAI,
    isPro: effectivePro,
    expiryDate,
    strategiesCount,
    strategyLimit,
    refresh,
  } = useUsageLimits(user?.id);

  // Best return across all backtests — find the best one with details
  const bestBacktest = backtests.length > 0
    ? backtests.reduce((best, b) => {
        const returnPct = b.initial_capital > 0 && b.net_pnl !== null
          ? (b.net_pnl / b.initial_capital) * 100
          : 0;
        const bestReturnPct = best && best.initial_capital > 0 && best.net_pnl !== null
          ? (best.net_pnl / best.initial_capital) * 100
          : 0;
        return returnPct > bestReturnPct ? b : best;
      }, backtests[0])
    : null;

  const bestReturn = bestBacktest && bestBacktest.initial_capital > 0 && bestBacktest.net_pnl !== null
    ? (bestBacktest.net_pnl / bestBacktest.initial_capital) * 100
    : 0;

  // Best confidence score
  const bestConfidenceBacktest = backtests.length > 0
    ? backtests.reduce((best, b) => {
        const score = (b as any).confidence_score ?? 0;
        const bestScore = best ? ((best as any).confidence_score ?? 0) : 0;
        return score > bestScore ? b : best;
      }, backtests[0])
    : null;
  const bestConfidence = bestConfidenceBacktest ? ((bestConfidenceBacktest as any).confidence_score ?? null) : null;

  const remainingRuns = backtestLimit !== null ? backtestLimit - monthlyBacktestsUsed : null;

  const queryClient = useQueryClient();

  // Immediate delete (no undo)
  const handleDeleteStrategy = async (strategyId: string, strategyName: string) => {
    const { error } = await supabase
      .from("strategies")
      .delete()
      .eq("id", strategyId);

    if (error) {
      console.error("Failed to delete strategy:", error);
      toast.error("Failed to delete strategy");
      return;
    }

    toast.success(`"${strategyName}" deleted`);
    queryClient.invalidateQueries({ queryKey: ["strategies", user?.id] });
    // Update strategy count in profile
    if (user) {
      await supabase
        .from("profiles")
        .update({ strategies_count: Math.max(0, strategiesCount - 1) })
        .eq("user_id", user.id);
      refresh();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Find the strategy name for the best backtest
  const bestStrategy = bestBacktest
    ? strategies.find(s => s.id === bestBacktest.strategy_id)
    : null;

  return (
    <AppLayout loading={loading} onSignOut={handleSignOut}>
      {/* Welcome + Plan Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
          <div className="flex items-center gap-2">
            {effectivePro ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full">
                <Crown className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">Pro</span>
                {expiryDate && (
                  <span className="text-xs text-muted-foreground">
                    · Expires {expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                <span className="text-sm font-medium text-foreground">Free Plan</span>
                {remainingRuns !== null && (
                  <span className="text-xs text-muted-foreground">
                    · {remainingRuns} runs left this month
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {effectivePro
            ? `Pro active · Expires ${expiryDate?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) ?? ""}`
            : `${remainingRuns ?? 0} backtest runs remaining this month`}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <MetricCard
          title="Strategies"
          value={strategiesCount}
          subtitle={effectivePro ? `${strategiesCount} created` : `of ${strategyLimit} used`}
          icon={Layers}
          variant="default"
          loading={dataLoading}
        />
        <MetricCard
          title="Backtests This Month"
          value={monthlyBacktestsUsed}
          subtitle={effectivePro ? `${monthlyBacktestsUsed} this month` : `of ${backtestLimit} used`}
          icon={FlaskConical}
          variant="accent"
          loading={dataLoading}
        />
        <MetricCard
          title="Best Return"
          value={bestReturn > 0 ? `+${bestReturn.toFixed(1)}%` : "N/A"}
          subtitle={bestBacktest && bestReturn > 0
            ? `${bestBacktest.symbol} · ${bestStrategy?.name ?? "Strategy"}`
            : "Run a backtest to see"}
          icon={TrendingUp}
          variant="success"
          loading={dataLoading}
        />
        <MetricCard
          title="Best Confidence"
          value={bestConfidence !== null && bestConfidence > 0 ? Math.round(bestConfidence).toString() : "N/A"}
          subtitle={bestConfidenceBacktest && bestConfidence !== null && bestConfidence > 0
            ? `${bestConfidenceBacktest.symbol} · Score ${Math.round(bestConfidence)}/100`
            : "Run a backtest to see"}
          icon={Shield}
          variant="warning"
          loading={dataLoading}
        />
      </div>

      {/* Usage Progress Bars - Free users */}
      {!effectivePro && (
        <Card className="mb-6 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usage Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageProgressBar
              label="Strategies"
              used={strategiesCount}
              limit={strategyLimit}
              icon={<Layers className="h-4 w-4 text-primary" />}
            />
            <UsageProgressBar
              label="Backtests (Monthly)"
              used={monthlyBacktestsUsed}
              limit={backtestLimit}
              icon={<FlaskConical className="h-4 w-4 text-accent" />}
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="group cursor-pointer border-border hover:border-primary/50 transition-all duration-200"
            onClick={() => navigate("/strategy-builder")}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Create Strategy</h3>
              <p className="text-xs text-muted-foreground">Build rules step-by-step</p>
            </CardContent>
          </Card>

          <Card
            className={`group cursor-pointer border-border hover:border-accent/50 transition-all duration-200 ${!canUseAI ? "opacity-60" : ""}`}
            onClick={() => (canUseAI ? navigate("/ai-strategy") : navigate("/upgrade"))}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                {!canUseAI && <Crown className="h-4 w-4 text-accent" />}
                {canUseAI && <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />}
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">AI Strategy</h3>
              <p className="text-xs text-muted-foreground">
                {canUseAI ? "Describe in plain English" : "Pro feature"}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`group cursor-pointer border-border hover:border-success/50 transition-all duration-200 ${!canRunBacktest ? "opacity-60" : ""}`}
            onClick={() => (canRunBacktest ? navigate("/backtest") : navigate("/upgrade"))}
          >
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-success transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Run Backtest</h3>
              <p className="text-xs text-muted-foreground">
                {canRunBacktest ? "Test against historical data" : "Monthly limit reached"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Strategies */}
      <StrategyList
        strategies={strategies}
        loading={dataLoading}
        isPro={effectivePro}
        onCreateStrategy={() => navigate("/strategy-builder")}
        onDeleteStrategy={handleDeleteStrategy}
      />
    </AppLayout>
  );
};

export default Dashboard;
