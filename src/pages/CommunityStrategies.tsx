import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Play,
  Eye,
  Calendar,
  BarChart3,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CommunityStrategyDetail } from "@/components/community/CommunityStrategyDetail";

interface CommunityStrategy {
  id: string;
  user_id: string;
  strategy_name: string;
  strategy_config: any;
  dataset_used: string;
  date_range_start: string | null;
  date_range_end: string | null;
  performance_metrics: any;
  equity_curve: any;
  created_at: string;
}

const CommunityStrategies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<CommunityStrategy[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<CommunityStrategy | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from("community_strategies")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStrategies((data as any[]) || []);
    } catch (err: any) {
      console.error("Error fetching community strategies:", err);
      toast.error("Failed to load community strategies");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStrategy = (strategy: CommunityStrategy) => {
    // Store strategy config in sessionStorage so BacktestRunner can pick it up
    sessionStorage.setItem("community_strategy", JSON.stringify({
      name: strategy.strategy_name,
      rules: strategy.strategy_config,
      dataset: strategy.dataset_used,
    }));
    toast.success("Strategy loaded! Redirecting to backtest...");
    navigate("/backtest");
  };

  const filtered = strategies.filter(s =>
    s.strategy_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.dataset_used.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <AppLayout loading={loading} showBack backTo="/dashboard" title="Community Strategies" subtitle="Discover and reuse strategies shared by traders">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search strategies by name or dataset..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{strategies.length} shared strategies</span>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 && !loading ? (
          <Card className="border-border">
            <CardContent className="py-16 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
              <h3 className="font-heading font-semibold mb-2">No Strategies Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Be the first to share a strategy! Run a backtest and click "Share Strategy" to publish it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((strategy, i) => {
              const metrics = strategy.performance_metrics || {};
              const isProfitable = (metrics.netPnl || 0) > 0;
              return (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border hover:border-accent/40 transition-colors group cursor-pointer h-full flex flex-col">
                    <CardContent className="p-4 flex flex-col flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-semibold text-sm truncate">{strategy.strategy_name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{strategy.dataset_used}</p>
                        </div>
                        <div className={`p-1.5 rounded-full ${isProfitable ? 'bg-success/10' : 'bg-destructive/10'}`}>
                          {isProfitable ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded bg-muted/30">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">CAGR</p>
                          <p className={`text-xs font-bold ${(metrics.cagr || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {(metrics.cagr || 0).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/30">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Drawdown</p>
                          <p className="text-xs font-bold text-destructive">
                            {(metrics.maxDrawdownPercent || 0).toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/30">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Win Rate</p>
                          <p className={`text-xs font-bold ${(metrics.winRate || 0) >= 50 ? 'text-success' : 'text-warning'}`}>
                            {(metrics.winRate || 0).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        <span>{strategy.date_range_start && strategy.date_range_end
                          ? `${formatDate(strategy.date_range_start)} — ${formatDate(strategy.date_range_end)}`
                          : formatDate(strategy.created_at)
                        }</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto pt-2 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => setSelectedStrategy(strategy)}
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => handleApplyStrategy(strategy)}
                        >
                          <Play className="h-3 w-3 mr-1" /> Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedStrategy && (
        <CommunityStrategyDetail
          strategy={selectedStrategy}
          open={!!selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
          onApply={() => handleApplyStrategy(selectedStrategy)}
        />
      )}
    </AppLayout>
  );
};

export default CommunityStrategies;
