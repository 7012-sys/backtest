import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, FlaskConical, Database, GitBranch } from "lucide-react";
import { format } from "date-fns";

interface ExperimentTimelineProps {
  projectId?: string;
  userId: string;
  limit?: number;
}

const eventTypeConfig: Record<string, { icon: any; color: string }> = {
  strategy_change: { icon: Layers, color: "text-primary" },
  param_change: { icon: GitBranch, color: "text-accent" },
  backtest_run: { icon: FlaskConical, color: "text-success" },
  data_change: { icon: Database, color: "text-warning" },
};

export const ExperimentTimeline = ({ projectId, userId, limit = 50 }: ExperimentTimelineProps) => {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["experiment-history", projectId, userId],
    queryFn: async () => {
      let query = supabase
        .from("experiment_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>;
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No experiment history yet</p>
          <p className="text-xs text-muted-foreground mt-1">Actions like creating strategies, running backtests, and uploading data will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
      {history.map((h) => {
        const config = eventTypeConfig[h.event_type] ?? { icon: GitBranch, color: "text-muted-foreground" };
        const Icon = config.icon;
        const eventData = h.event_data as Record<string, any>;
        return (
          <div key={h.id} className="relative pb-6">
            <div className="absolute -left-3.5 top-1 h-5 w-5 rounded-full bg-card border-2 border-border flex items-center justify-center">
              <Icon className={`h-3 w-3 ${config.color}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-foreground capitalize">
                {h.event_type.replace(/_/g, " ")}
              </p>
              {eventData?.description && (
                <p className="text-xs text-muted-foreground">{eventData.description}</p>
              )}
              {eventData?.strategy_name && (
                <p className="text-xs text-muted-foreground">Strategy: {eventData.strategy_name}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(h.created_at), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
