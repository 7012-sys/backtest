import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useSubscription } from "@/hooks/useSubscription";
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
  ThumbsUp,
  Trash2,
  Crown,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CommunityStrategyDetail } from "@/components/community/CommunityStrategyDetail";
import { LimitReachedModal } from "@/components/ui/limit-reached-modal";

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
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState<CommunityStrategy[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<CommunityStrategy | null>(null);
  const [user, setUser] = useState<any>(null);

  // Like state: strategyId -> count, and set of liked strategy IDs
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  const { isPro } = useSubscription(user?.id);

  useEffect(() => {
    fetchStrategies();
  }, []);

  useEffect(() => {
    if (strategies.length > 0) {
      fetchLikes();
    }
  }, [strategies, user]);

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

  const fetchLikes = async () => {
    try {
      const strategyIds = strategies.map(s => s.id);

      // Fetch all likes for these strategies
      const { data: allLikes, error } = await supabase
        .from("strategy_likes")
        .select("strategy_id, user_id")
        .in("strategy_id", strategyIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      const liked = new Set<string>();

      (allLikes || []).forEach((like: any) => {
        counts[like.strategy_id] = (counts[like.strategy_id] || 0) + 1;
        if (user && like.user_id === user.id) {
          liked.add(like.strategy_id);
        }
      });

      setLikeCounts(counts);
      setUserLikes(liked);
    } catch (err) {
      console.error("Error fetching likes:", err);
    }
  };

  const handleToggleLike = async (strategyId: string) => {
    if (!user) {
      toast.error("Please sign in to like strategies");
      return;
    }
    if (likingId) return;

    setLikingId(strategyId);
    const alreadyLiked = userLikes.has(strategyId);

    try {
      if (alreadyLiked) {
        const { error } = await supabase
          .from("strategy_likes")
          .delete()
          .eq("strategy_id", strategyId)
          .eq("user_id", user.id);
        if (error) throw error;

        setUserLikes(prev => { const n = new Set(prev); n.delete(strategyId); return n; });
        setLikeCounts(prev => ({ ...prev, [strategyId]: Math.max(0, (prev[strategyId] || 1) - 1) }));
      } else {
        const { error } = await supabase
          .from("strategy_likes")
          .insert({ strategy_id: strategyId, user_id: user.id });
        if (error) throw error;

        setUserLikes(prev => new Set(prev).add(strategyId));
        setLikeCounts(prev => ({ ...prev, [strategyId]: (prev[strategyId] || 0) + 1 }));
      }
    } catch (err: any) {
      console.error("Error toggling like:", err);
      toast.error("Failed to update like");
    } finally {
      setLikingId(null);
    }
  };

  const handleApplyStrategy = (strategy: CommunityStrategy) => {
    sessionStorage.setItem("community_strategy", JSON.stringify({
      name: strategy.strategy_name,
      rules: strategy.strategy_config,
      dataset: strategy.dataset_used,
    }));
    toast.success("Strategy loaded! Redirecting to backtest...");
    navigate("/backtest");
  };

  const handleAdminDelete = async (strategyId: string) => {
    if (!confirm("Are you sure you want to delete this community strategy?")) return;
    try {
      // Delete associated likes first
      await supabase.from("strategy_likes").delete().eq("strategy_id", strategyId);
      const { error } = await supabase.from("community_strategies").delete().eq("id", strategyId);
      if (error) throw error;
      setStrategies(prev => prev.filter(s => s.id !== strategyId));
      if (selectedStrategy?.id === strategyId) setSelectedStrategy(null);
      toast.success("Strategy deleted successfully");
    } catch (err: any) {
      console.error("Error deleting strategy:", err);
      toast.error("Failed to delete strategy");
    }
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
              const likeCount = likeCounts[strategy.id] || 0;
              const isLiked = userLikes.has(strategy.id);
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

                      {/* Date + Likes row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{strategy.date_range_start && strategy.date_range_end
                            ? `${formatDate(strategy.date_range_start)} — ${formatDate(strategy.date_range_end)}`
                            : formatDate(strategy.created_at)
                          }</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleLike(strategy.id); }}
                          disabled={likingId === strategy.id}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                            isLiked
                              ? 'bg-accent/15 text-accent'
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <ThumbsUp className={`h-3 w-3 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{likeCount}</span>
                        </button>
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
                        {isPro ? (
                          <Button
                            size="sm"
                            className="flex-1 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={() => handleApplyStrategy(strategy)}
                          >
                            <Play className="h-3 w-3 mr-1" /> Apply
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs opacity-70 cursor-not-allowed"
                            onClick={() => setShowUpgradeModal(true)}
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            Apply
                            <Crown className="h-3 w-3 ml-1 text-accent" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-xs px-2"
                            onClick={(e) => { e.stopPropagation(); handleAdminDelete(strategy.id); }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
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
          onApply={() => {
            if (isPro) {
              handleApplyStrategy(selectedStrategy);
            } else {
              setShowUpgradeModal(true);
            }
          }}
          likeCount={likeCounts[selectedStrategy.id] || 0}
          isLiked={userLikes.has(selectedStrategy.id)}
          onToggleLike={() => handleToggleLike(selectedStrategy.id)}
          isLiking={likingId === selectedStrategy.id}
          isAdmin={isAdmin}
          onAdminDelete={() => handleAdminDelete(selectedStrategy.id)}
          isPro={isPro}
        />
      )}

      <LimitReachedModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="pro_feature"
        featureName="Apply Community Strategy"
      />
    </AppLayout>
  );
};

export default CommunityStrategies;
