import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers, GitBranch, BookOpen, Play, Sparkles, Clock, BarChart3, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { User } from "@supabase/supabase-js";
import { VersionHistory } from "@/components/strategy/VersionHistory";
import { JournalTab } from "@/components/strategy/JournalTab";
import { BacktestHistory } from "@/components/strategy/BacktestHistory";
import { useSubscription } from "@/hooks/useSubscription";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { toast } from "sonner";

const StrategyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
  }, [navigate]);

  const strategyQuery = useQuery({
    queryKey: ["strategy-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("strategies").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const strategy = strategyQuery.data;
  const rules = strategy?.rules as any;

  const { isPro } = useSubscription(user?.id);
  const { strategiesCount, refresh } = useUsageLimits(user?.id);
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDelete = async () => {
    if (!strategy) return;
    if (!confirm(`Delete "${strategy.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("strategies").delete().eq("id", strategy.id);
    if (error) { toast.error("Failed to delete strategy"); return; }
    toast.success(`"${strategy.name}" deleted`);
    if (user) {
      await supabase.from("profiles").update({ strategies_count: Math.max(0, strategiesCount - 1) }).eq("user_id", user.id);
      refresh();
    }
    navigate("/strategies");
  };

  const headerRight = strategy ? (
    <div className="flex items-center gap-2">
      {isPro && (
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
        </Button>
      )}
      <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate(`/backtest?strategy=${strategy.id}`)}>
        <Play className="h-3.5 w-3.5 mr-1" /> Backtest
      </Button>
    </div>
  ) : null;

  return (
    <AppLayout loading={loading || strategyQuery.isLoading} showBack backTo="/dashboard" title={strategy?.name ?? "Strategy"} subtitle={strategy ? `Version ${strategy.current_version}` : ""} rightContent={headerRight} onSignOut={handleSignOut}>
      {strategy && (
        <>
          {/* Strategy Meta */}
          <div className="flex items-center gap-2 mb-6">
            <Badge variant="outline" className="text-xs">V{strategy.current_version}</Badge>
            {strategy.is_ai_generated && (
              <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                <Sparkles className="h-3 w-3 mr-1" />AI Generated
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Updated {format(new Date(strategy.updated_at), "MMM d, yyyy")}
            </span>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview" className="gap-1.5"><Layers className="h-3.5 w-3.5" /> Overview</TabsTrigger>
              <TabsTrigger value="backtests" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Backtests</TabsTrigger>
              <TabsTrigger value="versions" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Versions</TabsTrigger>
              <TabsTrigger value="journal" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Journal</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-sm text-success">Entry Rules (Buy)</CardTitle></CardHeader>
                  <CardContent>
                    {(rules?.entry ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No entry rules defined</p>
                    ) : (
                      <ul className="space-y-2">
                        {(rules.entry as any[]).map((r: any, i: number) => (
                          <li key={i} className="text-xs p-2 rounded bg-muted/50 border border-border">
                            <span className="font-mono">{r.indicator}</span> {r.condition} <span className="font-semibold">{r.value}</span>
                            {r.logic && <Badge variant="outline" className="ml-2 text-xs">{r.logic}</Badge>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm text-destructive">Exit Rules (Sell)</CardTitle></CardHeader>
                  <CardContent>
                    {(rules?.exit ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No exit rules defined</p>
                    ) : (
                      <ul className="space-y-2">
                        {(rules.exit as any[]).map((r: any, i: number) => (
                          <li key={i} className="text-xs p-2 rounded bg-muted/50 border border-border">
                            <span className="font-mono">{r.indicator}</span> {r.condition} <span className="font-semibold">{r.value}</span>
                            {r.logic && <Badge variant="outline" className="ml-2 text-xs">{r.logic}</Badge>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
              {strategy.description && (
                <Card className="mt-4">
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="backtests">
              <BacktestHistory strategyId={strategy.id} />
            </TabsContent>

            <TabsContent value="versions">
              <VersionHistory strategyId={strategy.id} currentVersion={strategy.current_version} />
            </TabsContent>

            <TabsContent value="journal">
              {user && <JournalTab strategyId={strategy.id} userId={user.id} />}
            </TabsContent>
          </Tabs>
        </>
      )}
    </AppLayout>
  );
};

export default StrategyDetail;