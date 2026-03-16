import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Trash2, X, Save } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface JournalTabProps {
  strategyId: string;
  userId: string;
}

export const JournalTab = ({ strategyId, userId }: JournalTabProps) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: journals = [], isLoading } = useQuery({
    queryKey: ["strategy-journals", strategyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategy_journals")
        .select("*")
        .eq("strategy_id", strategyId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!strategyId && !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("strategy_journals").insert({
        strategy_id: strategyId,
        user_id: userId,
        title: title.trim(),
        content: content.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy-journals", strategyId] });
      setTitle("");
      setContent("");
      setShowForm(false);
      toast.success("Journal entry added");
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("strategy_journals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategy-journals", strategyId] });
      toast.success("Entry deleted");
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Journal Entries ({journals.length})</h3>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Note
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-accent/30">
          <CardContent className="py-4 space-y-3">
            <Input placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            <Textarea placeholder="Your observations, hypothesis, improvements..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setTitle(""); setContent(""); }}>
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending}>
                <Save className="h-3.5 w-3.5 mr-1" /> Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {journals.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No journal entries yet</p>
            <p className="text-xs text-muted-foreground mt-1">Track your ideas, hypotheses, and observations</p>
          </CardContent>
        </Card>
      ) : (
        journals.map((j) => (
          <Card key={j.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground text-sm">{j.title}</h4>
                  {j.content && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{j.content}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{format(new Date(j.created_at), "MMM d, yyyy · h:mm a")}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteMutation.mutate(j.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
