import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, Bug, Lightbulb, MessageCircle } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug Report", icon: Bug, color: "text-destructive" },
  { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-accent" },
  { value: "general", label: "General", icon: MessageCircle, color: "text-primary" },
] as const;

export const FeedbackModal = ({ open, onOpenChange }: FeedbackModalProps) => {
  const [type, setType] = useState<"bug" | "feature" | "general">("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Please provide more detail (at least 10 characters)");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Please sign in to send feedback");
        return;
      }

      const { error } = await supabase.from("feedback").insert({
        user_id: session.user.id,
        type,
        message: message.trim().slice(0, 2000),
      });

      if (error) throw error;

      toast.success("Feedback sent! Thank you.");
      setMessage("");
      setType("general");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>Help us improve TradeTest by sharing your thoughts.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as typeof type)} className="flex gap-3">
              {FEEDBACK_TYPES.map((ft) => (
                <label
                  key={ft.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    type === ft.value ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                  }`}
                >
                  <RadioGroupItem value={ft.value} className="sr-only" />
                  <ft.icon className={`h-4 w-4 ${ft.color}`} />
                  <span className="text-sm font-medium">{ft.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
