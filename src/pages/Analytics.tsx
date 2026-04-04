import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EquityCurveChart } from "@/components/dashboard/EquityCurveChart";
import { TimePeriodPnLChart } from "@/components/dashboard/TimePeriodPnLChart";
import { ProFeatureLock, ProBadge } from "@/components/ui/pro-feature-lock";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Target,
  Zap,
  Award,
  LineChart 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RechartsPie,
  Pie,
  Legend
} from "recharts";

interface BacktestData {
  id: string;
  created_at: string;
  net_pnl: number | null;
  win_rate: number | null;
  total_trades: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  max_drawdown: number | null;
  profit_factor: number | null;
  symbol: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backtests, setBacktests] = useState<BacktestData[]>([]);
  const { isPro, isLoading: subscriptionLoading, expiryDate, daysRemaining } = useSubscription(user?.id);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await fetchBacktests(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchBacktests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("backtests")
        .select("id, created_at, net_pnl, win_rate, total_trades, winning_trades, losing_trades, max_drawdown, profit_factor, symbol")
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .limit(200);

      if (!error && data) {
        setBacktests(data);
      }
    } catch (error) {
      console.error("Error fetching backtests:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare equity curve data
  const equityData = backtests.reduce((acc, bt, index) => {
    const prevEquity = acc[acc.length - 1]?.equity || 100000;
    return [...acc, {
      date: new Date(bt.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      equity: prevEquity + (bt.net_pnl || 0)
    }];
  }, [] as Array<{ date: string; equity: number }>);

  // Prepare weekly data
  const weeklyData = backtests.reduce((acc, bt) => {
    const date = new Date(bt.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    
    const existing = acc.find(w => w.period === weekKey);
    if (existing) {
      existing.pnl += bt.net_pnl || 0;
      existing.trades += bt.total_trades || 0;
      existing.backtests += 1;
    } else {
      acc.push({
        period: weekKey,
        pnl: bt.net_pnl || 0,
        trades: bt.total_trades || 0,
        backtests: 1
      });
    }
    return acc;
  }, [] as Array<{ period: string; pnl: number; trades: number; backtests: number }>);

  // Prepare monthly data
  const monthlyData = backtests.reduce((acc, bt) => {
    const month = new Date(bt.created_at).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    const existing = acc.find(m => m.period === month);
    if (existing) {
      existing.pnl += bt.net_pnl || 0;
      existing.trades += bt.total_trades || 0;
      existing.backtests += 1;
    } else {
      acc.push({
        period: month,
        pnl: bt.net_pnl || 0,
        trades: bt.total_trades || 0,
        backtests: 1
      });
    }
    return acc;
  }, [] as Array<{ period: string; pnl: number; trades: number; backtests: number }>);

  // Symbol performance data
  const symbolPerformance = backtests.reduce((acc, bt) => {
    const existing = acc.find(s => s.symbol === bt.symbol);
    if (existing) {
      existing.pnl += bt.net_pnl || 0;
      existing.trades += bt.total_trades || 0;
      existing.backtests += 1;
    } else {
      acc.push({
        symbol: bt.symbol,
        pnl: bt.net_pnl || 0,
        trades: bt.total_trades || 0,
        backtests: 1
      });
    }
    return acc;
  }, [] as Array<{ symbol: string; pnl: number; trades: number; backtests: number }>);

  // Win/Loss distribution
  const totalWins = backtests.reduce((sum, bt) => sum + (bt.winning_trades || 0), 0);
  const totalLosses = backtests.reduce((sum, bt) => sum + (bt.losing_trades || 0), 0);
  const winLossData = [
    { name: "Winning Trades", value: totalWins, fill: "hsl(var(--success))" },
    { name: "Losing Trades", value: totalLosses, fill: "hsl(var(--destructive))" }
  ];

  // Summary stats
  const totalPnL = backtests.reduce((sum, bt) => sum + (bt.net_pnl || 0), 0);
  const avgWinRate = backtests.length > 0 
    ? backtests.reduce((sum, bt) => sum + (bt.win_rate || 0), 0) / backtests.length 
    : 0;
  const avgProfitFactor = backtests.filter(bt => bt.profit_factor).length > 0
    ? backtests.reduce((sum, bt) => sum + (bt.profit_factor || 0), 0) / backtests.filter(bt => bt.profit_factor).length
    : 0;
  const maxDrawdown = Math.min(...backtests.map(bt => bt.max_drawdown || 0), 0);

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate("/");
  };

  const isLoading = loading || subscriptionLoading;

  return (
    <AppLayout onSignOut={handleSignOut}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" />
              Analytics
              <ProBadge />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Advanced insights and performance analytics for Pro users
            </p>
          </div>
          {isPro && expiryDate && (
            <div className="text-right text-sm">
              <span className="text-muted-foreground">Pro valid for </span>
              <span className="font-medium text-accent">{daysRemaining} days</span>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Total P&L</span>
              </div>
              <div className={`text-xl font-bold ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Avg Win Rate</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {avgWinRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-xs">Profit Factor</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {avgProfitFactor.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Activity className="h-4 w-4" />
                <span className="text-xs">Max Drawdown</span>
              </div>
              <div className="text-xl font-bold text-destructive">
                {maxDrawdown.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EquityCurveChart 
            data={equityData} 
            loading={isLoading} 
            isPro={isPro}
          />
          <TimePeriodPnLChart 
            weeklyData={weeklyData} 
            monthlyData={monthlyData} 
            loading={isLoading}
            isPro={isPro}
          />
        </div>

        {/* Symbol Performance Chart */}
        <ProFeatureLock
          title="Symbol Performance"
          description="See which symbols perform best in your backtests"
          icon={BarChart3}
          isUnlocked={isPro}
          featureName="Symbol Performance Analytics"
        >
          <Card className="border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Performance by Symbol
              </CardTitle>
              <CardDescription className="text-xs">
                Compare P&L across different trading symbols
              </CardDescription>
            </CardHeader>
            <CardContent>
              {symbolPerformance.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={symbolPerformance} layout="vertical" margin={{ left: 60 }}>
                      <XAxis type="number" tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="symbol" tick={{ fontSize: 12 }} width={60} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'P&L']}
                      />
                      <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                        {symbolPerformance.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No symbol data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ProFeatureLock>

        {/* Win/Loss Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProFeatureLock
            title="Win/Loss Distribution"
            description="Visualize your winning vs losing trades ratio"
            icon={PieChart}
            isUnlocked={isPro}
            featureName="Win/Loss Distribution"
          >
            <Card className="border-border shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-accent" />
                  Trade Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Breakdown of winning vs losing trades
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalWins + totalLosses > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={winLossData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {winLossData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No trade data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ProFeatureLock>

          {/* Performance Insights */}
          <ProFeatureLock
            title="Performance Insights"
            description="AI-powered insights about your trading patterns"
            icon={Award}
            isUnlocked={isPro}
            featureName="Performance Insights"
          >
            <Card className="border-border shadow-card h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent" />
                  Key Insights
                </CardTitle>
                <CardDescription className="text-xs">
                  Actionable insights from your backtest data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {backtests.length > 0 ? (
                  <>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">Best Performer</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {symbolPerformance.sort((a, b) => b.pnl - a.pnl)[0]?.symbol || 'N/A'} generated the highest returns
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Win Rate Analysis</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {avgWinRate >= 50 
                          ? `Your ${avgWinRate.toFixed(0)}% win rate is above average!` 
                          : `Focus on improving your ${avgWinRate.toFixed(0)}% win rate`}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium">Risk Management</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Math.abs(maxDrawdown) <= 10 
                          ? "Excellent drawdown control" 
                          : "Consider tighter stop losses to reduce drawdown"}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Award className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Run backtests to see insights</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </ProFeatureLock>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
