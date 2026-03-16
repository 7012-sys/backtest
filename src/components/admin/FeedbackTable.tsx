import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Bug, Lightbulb, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Feedback {
  id: string;
  user_id: string;
  type: "bug" | "feature" | "general";
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  profile?: { display_name: string | null; email: string | null };
}

export const FeedbackTable = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      setLoading(false);
      return;
    }

    // Enrich with profiles
    const userIds = [...new Set((data || []).map((f) => f.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);

    const enriched = (data || []).map((f) => ({
      ...f,
      profile: profiles?.find((p) => p.user_id === f.user_id),
    }));

    setFeedbacks(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("feedback")
      .update({ status: status as any })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success("Status updated");
    fetchFeedbacks();
  };

  const typeIcons = {
    bug: <Bug className="h-3.5 w-3.5 text-destructive" />,
    feature: <Lightbulb className="h-3.5 w-3.5 text-accent" />,
    general: <MessageCircle className="h-3.5 w-3.5 text-primary" />,
  };

  const statusColors: Record<string, string> = {
    open: "bg-warning/10 text-warning border-warning/30",
    in_progress: "bg-accent/10 text-accent border-accent/30",
    resolved: "bg-success/10 text-success border-success/30",
    closed: "bg-muted text-muted-foreground border-border",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No feedback submitted yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="max-w-[300px]">Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((fb) => (
            <TableRow key={fb.id}>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {typeIcons[fb.type]}
                  <span className="text-xs capitalize">{fb.type}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs">
                {fb.profile?.email || fb.profile?.display_name || fb.user_id.slice(0, 8)}
              </TableCell>
              <TableCell className="text-xs max-w-[300px] truncate">{fb.message}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${statusColors[fb.status] || ""}`}>
                  {fb.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(fb.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <Select value={fb.status} onValueChange={(v) => updateStatus(fb.id, v)}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
