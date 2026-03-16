import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock } from "lucide-react";
import { format } from "date-fns";

interface VersionHistoryProps {
  strategyId: string;
  currentVersion: number;
}

export const VersionHistory = ({ strategyId, currentVersion }: VersionHistoryProps) => {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["strategy-versions", strategyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategy_versions")
        .select("*")
        .eq("strategy_id", strategyId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!strategyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No version history yet</p>
          <p className="text-xs text-muted-foreground mt-1">Versions are created when you edit the strategy</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />
      {versions.map((v) => {
        const isCurrent = v.version_number === currentVersion;
        return (
          <div key={v.id} className="relative pb-5">
            <div className={`absolute -left-3.5 top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${isCurrent ? "bg-accent border-accent" : "bg-card border-border"}`}>
              <GitBranch className={`h-3 w-3 ${isCurrent ? "text-accent-foreground" : "text-muted-foreground"}`} />
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">V{v.version_number}</span>
                {isCurrent && (
                  <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">Current</Badge>
                )}
              </div>
              {v.changelog && (
                <p className="text-xs text-muted-foreground mt-0.5">{v.changelog}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(v.created_at), "MMM d, yyyy · h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
