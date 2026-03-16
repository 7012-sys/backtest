import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Layers,
  FlaskConical,
  Database,
  BookOpen,
  GitBranch,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  BarChart3,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { User } from "@supabase/supabase-js";

const ProjectDetail = () => {
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

  const projectQuery = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const strategiesQuery = useQuery({
    queryKey: ["project-strategies", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .eq("project_id", id!)
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const backtestsQuery = useQuery({
    queryKey: ["project-backtests", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backtests")
        .select("*")
        .eq("project_id", id!)
        .eq("user_id", user!.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const journalsQuery = useQuery({
    queryKey: ["project-journals", id],
    queryFn: async () => {
      if (!user) return [];
      // Get strategy IDs for this project first
      const strategyIds = strategiesQuery.data?.map((s) => s.id) ?? [];
      if (strategyIds.length === 0) return [];
      const { data, error } = await supabase
        .from("strategy_journals")
        .select("*")
        .in("strategy_id", strategyIds)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!strategiesQuery.data,
  });

  const historyQuery = useQuery({
    queryKey: ["project-history", id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("experiment_history")
        .select("*")
        .eq("project_id", id!)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const project = projectQuery.data;
  const strategies = strategiesQuery.data ?? [];
  const backtests = backtestsQuery.data ?? [];
  const journals = journalsQuery.data ?? [];
  const history = historyQuery.data ?? [];

  const eventTypeIcon: Record<string, any> = {
    strategy_change: Layers,
    param_change: GitBranch,
    backtest_run: FlaskConical,
    data_change: Database,
  };

  return (
    <AppLayout loading={loading} onSignOut={handleSignOut}>
      {project && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
      )}

      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Strategies ({strategies.length})
          </TabsTrigger>
          <TabsTrigger value="backtests" className="gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Backtests ({backtests.length})
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Journal ({journals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* Strategies */}
        <TabsContent value="strategies">
          {strategies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No strategies in this project</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/strategy-builder")}>
                  Create Strategy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {strategies.map((s) => (
                <Card key={s.id} className="cursor-pointer hover:border-accent/30 transition-colors" onClick={() => navigate(`/strategy/${s.id}`)}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground text-sm">{s.name}</h4>
                        {s.is_ai_generated && (
                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                            <Sparkles className="h-3 w-3 mr-1" />AI
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">V{s.current_version}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(s.updated_at), "MMM d, yyyy")}
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Backtests */}
        <TabsContent value="backtests">
          {backtests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No backtests in this project</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/backtest")}>
                  Run Backtest
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {backtests.map((bt) => {
                const isProfit = (bt.net_pnl ?? 0) >= 0;
                return (
                  <Card key={bt.id} className="cursor-pointer hover:border-accent/30 transition-colors" onClick={() => navigate(`/backtest/${bt.id}`)}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">{bt.symbol}</Badge>
                          <span className="text-xs text-muted-foreground">{bt.timeframe}</span>
                          <span className="text-xs text-muted-foreground">{bt.total_trades ?? 0} trades</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold flex items-center gap-1 ${isProfit ? "text-success" : "text-destructive"}`}>
                            {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {isProfit ? "+" : ""}₹{(bt.net_pnl ?? 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">{format(new Date(bt.created_at), "MMM d")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Journal */}
        <TabsContent value="journal">
          {journals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No journal entries yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add notes from the strategy detail page</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {journals.map((j) => (
                <Card key={j.id}>
                  <CardContent className="py-4">
                    <h4 className="font-medium text-foreground text-sm mb-1">{j.title}</h4>
                    {j.content && <p className="text-xs text-muted-foreground line-clamp-3">{j.content}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{format(new Date(j.created_at), "MMM d, yyyy")}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GitBranch className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No experiment history yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative pl-6 space-y-0">
              <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
              {history.map((h) => {
                const Icon = eventTypeIcon[h.event_type] ?? GitBranch;
                const eventData = h.event_data as Record<string, any>;
                return (
                  <div key={h.id} className="relative pb-6">
                    <div className="absolute -left-3.5 top-1 h-5 w-5 rounded-full bg-card border-2 border-border flex items-center justify-center">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {h.event_type.replace("_", " ")}
                      </p>
                      {eventData?.description && (
                        <p className="text-xs text-muted-foreground">{eventData.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(h.created_at), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ProjectDetail;
