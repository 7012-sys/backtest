import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Clock, TrendingUp, TrendingDown, Trash2, ChevronRight, LineChart, Crown } from "lucide-react";
import { format } from "date-fns";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { useSubscription } from "@/hooks/useSubscription";
import { LimitReachedModal, LimitType } from "@/components/ui/limit-reached-modal";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  is_ai_generated: boolean | null;
  created_at: string;
  updated_at: string;
  current_version: number;
}

const Strategies = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { strategiesCount, canCreateStrategy, refresh } = useUsageLimits(user?.id);
  const { isPro } = useSubscription(user?.id);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { data: strategies = [], isLoading: strategiesLoading } = useQuery({
    queryKey: ["all-strategies", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Strategy[];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("strategies").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success(`"${name}" deleted`);
    queryClient.invalidateQueries({ queryKey: ["all-strategies", user?.id] });
    if (user) {
      await supabase.from("profiles").update({ strategies_count: Math.max(0, strategiesCount - 1) }).eq("user_id", user.id);
      refresh();
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut({ scope: 'local' }); navigate("/auth"); };

  return (
    <AppLayout loading={loading} showBack backTo="/dashboard" title="All Strategies" subtitle={`${strategies.length} strategies`} onSignOut={handleSignOut}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Your Strategies {!isPro && <span className="text-xs text-muted-foreground font-normal">({strategies.length}/2)</span>}</h2>
        <Button onClick={() => {
          if (!canCreateStrategy) { setShowLimitModal(true); return; }
          navigate("/strategy-builder");
        }} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" /> New Strategy
        </Button>
      </div>
      <LimitReachedModal open={showLimitModal} onOpenChange={setShowLimitModal} limitType="strategy" />

      {strategiesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : strategies.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-16 text-center">
            <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-medium mb-1">No strategies yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first strategy to get started</p>
            <Button variant="outline" onClick={() => navigate("/strategy-builder")}>
              <Plus className="h-4 w-4 mr-2" /> Create Strategy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {strategies.map(strategy => (
            <Card
              key={strategy.id}
              className="border-border hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/strategy/${strategy.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm">{strategy.name}</h4>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">V{strategy.current_version}</Badge>
                    {strategy.is_ai_generated && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-accent/10 text-accent border-accent/30">
                        <Sparkles className="h-3 w-3 mr-1" /> AI
                      </Badge>
                    )}
                  </div>
                   <div className="flex items-center gap-1">
                    {isPro && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${strategy.name}"? This cannot be undone.`)) {
                            handleDelete(strategy.id, strategy.name);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
                {strategy.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{strategy.description}</p>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(strategy.updated_at), "MMM d, yyyy")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Strategies;
