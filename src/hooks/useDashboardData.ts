import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, format, parseISO } from "date-fns";

export interface DashboardMetrics {
  totalStrategies: number;
  totalBacktests: number;
  totalTrades: number;
  avgWinRate: number;
  totalPnL: number;
  bestWinRate: number;
  avgProfitFactor: number;
  avgMaxDrawdown: number;
  winningTrades: number;
  losingTrades: number;
  winningPnL: number;
  losingPnL: number;
  initialCapital: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string | null;
  is_ai_generated: boolean | null;
  created_at: string;
  updated_at: string;
  lastBacktest?: {
    win_rate: number | null;
    net_pnl: number | null;
    total_trades: number | null;
  };
}

export interface Backtest {
  id: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  net_pnl: number | null;
  win_rate: number | null;
  total_trades: number | null;
  winning_trades: number | null;
  losing_trades: number | null;
  max_drawdown: number | null;
  profit_factor: number | null;
  created_at: string;
  strategy_id: string;
}

export const useDashboardData = (userId: string | undefined) => {
  // Fetch strategies
  const strategiesQuery = useQuery({
    queryKey: ["strategies", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as Strategy[];
    },
    enabled: !!userId,
  });

  // Fetch backtests
  const backtestsQuery = useQuery({
    queryKey: ["backtests", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("backtests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Backtest[];
    },
    enabled: !!userId,
  });

  // Calculate metrics
  const backtestData = backtestsQuery.data ?? [];
  const winningTrades = backtestData.reduce((sum, b) => sum + (b.winning_trades ?? 0), 0);
  const losingTrades = backtestData.reduce((sum, b) => sum + (b.losing_trades ?? 0), 0);
  
  // Calculate winning and losing P&L (estimate based on available data)
  const totalPnL = backtestData.reduce((sum, b) => sum + (b.net_pnl ?? 0), 0);
  const avgPnLPerWin = winningTrades > 0 ? (totalPnL > 0 ? totalPnL / winningTrades : 0) : 0;
  
  const metrics: DashboardMetrics = {
    totalStrategies: strategiesQuery.data?.length ?? 0,
    totalBacktests: backtestData.length,
    totalTrades: backtestData.reduce((sum, b) => sum + (b.total_trades ?? 0), 0),
    avgWinRate: backtestData.length 
      ? backtestData.reduce((sum, b) => sum + (b.win_rate ?? 0), 0) / backtestData.length 
      : 0,
    totalPnL,
    bestWinRate: backtestData.length 
      ? Math.max(...backtestData.map(b => b.win_rate ?? 0)) 
      : 0,
    avgProfitFactor: backtestData.length
      ? backtestData.reduce((sum, b) => sum + (b.profit_factor ?? 0), 0) / backtestData.length
      : 0,
    avgMaxDrawdown: backtestData.length
      ? backtestData.reduce((sum, b) => sum + (b.max_drawdown ?? 0), 0) / backtestData.length
      : 0,
    winningTrades,
    losingTrades,
    winningPnL: backtestData.filter(b => (b.net_pnl ?? 0) > 0).reduce((sum, b) => sum + (b.net_pnl ?? 0), 0),
    losingPnL: Math.abs(backtestData.filter(b => (b.net_pnl ?? 0) < 0).reduce((sum, b) => sum + (b.net_pnl ?? 0), 0)),
    initialCapital: backtestData[0]?.initial_capital ?? 100000,
  };

  // Generate equity curve from backtests
  const equityCurveData = backtestsQuery.data?.length 
    ? backtestsQuery.data
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .reduce((acc, backtest, index) => {
          const prevEquity = index > 0 ? acc[index - 1].equity : backtest.initial_capital;
          acc.push({
            date: new Date(backtest.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
            equity: prevEquity + (backtest.net_pnl ?? 0),
          });
          return acc;
        }, [] as { date: string; equity: number }[])
    : [];

  // Generate mock candlestick data for visualization
  const generateMockCandleData = () => {
    const data = [];
    let price = 22500;
    const today = new Date();
    
    for (let i = 20; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.48) * 200;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 80;
      const low = Math.min(open, close) - Math.random() * 80;
      
      data.push({
        date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
      });
      
      price = close;
    }
    
    return data;
  };

  // Enrich strategies with last backtest data
  const enrichedStrategies = strategiesQuery.data?.map(strategy => {
    const strategyBacktests = backtestsQuery.data?.filter(b => b.strategy_id === strategy.id) ?? [];
    const lastBacktest = strategyBacktests[0];
    
    return {
      ...strategy,
      lastBacktest: lastBacktest ? {
        win_rate: lastBacktest.win_rate,
        net_pnl: lastBacktest.net_pnl,
        total_trades: lastBacktest.total_trades,
      } : undefined,
    };
  }) ?? [];

  // Prepare backtest history for chart
  const backtestHistory = backtestData.map(bt => ({
    id: bt.id,
    symbol: bt.symbol,
    netPnL: bt.net_pnl ?? 0,
    winRate: bt.win_rate ?? 0,
    date: new Date(bt.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
  }));

  // Aggregate P&L by week
  const weeklyPnLData = (() => {
    const weeklyMap = new Map<string, { pnl: number; trades: number; backtests: number }>();
    
    backtestData.forEach(bt => {
      const date = parseISO(bt.created_at);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
      const weekKey = format(weekStart, "MMM d");
      
      const existing = weeklyMap.get(weekKey) || { pnl: 0, trades: 0, backtests: 0 };
      weeklyMap.set(weekKey, {
        pnl: existing.pnl + (bt.net_pnl ?? 0),
        trades: existing.trades + (bt.total_trades ?? 0),
        backtests: existing.backtests + 1,
      });
    });

    return Array.from(weeklyMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .slice(-8); // Last 8 weeks
  })();

  // Aggregate P&L by month
  const monthlyPnLData = (() => {
    const monthlyMap = new Map<string, { pnl: number; trades: number; backtests: number }>();
    
    backtestData.forEach(bt => {
      const date = parseISO(bt.created_at);
      const monthStart = startOfMonth(date);
      const monthKey = format(monthStart, "MMM yyyy");
      
      const existing = monthlyMap.get(monthKey) || { pnl: 0, trades: 0, backtests: 0 };
      monthlyMap.set(monthKey, {
        pnl: existing.pnl + (bt.net_pnl ?? 0),
        trades: existing.trades + (bt.total_trades ?? 0),
        backtests: existing.backtests + 1,
      });
    });

    return Array.from(monthlyMap.entries())
      .map(([period, data]) => ({ period, ...data }))
      .slice(-6); // Last 6 months
  })();

  return {
    metrics,
    strategies: enrichedStrategies,
    backtests: backtestsQuery.data ?? [],
    equityCurveData,
    backtestHistory,
    weeklyPnLData,
    monthlyPnLData,
    candleData: generateMockCandleData(),
    isLoading: strategiesQuery.isLoading || backtestsQuery.isLoading,
    error: strategiesQuery.error || backtestsQuery.error,
  };
};
