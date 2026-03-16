import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Download } from "lucide-react";
import { format } from "date-fns";
import { exportToCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  razorpay_subscription_id: string | null;
  profile?: {
    display_name: string | null;
    phone: string | null;
  };
}

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  loading: boolean;
  onUpdate?: () => void;
}

export const SubscriptionsTable = ({ subscriptions, loading, onUpdate }: SubscriptionsTableProps) => {
  const [updating, setUpdating] = useState<string | null>(null);

  const handlePlanChange = async (subscriptionId: string, newPlan: string) => {
    setUpdating(subscriptionId);
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: newPlan, updated_at: new Date().toISOString() })
      .eq("id", subscriptionId);
    
    setUpdating(null);
    if (error) {
      toast.error("Failed to update plan");
    } else {
      toast.success(`Plan updated to ${newPlan}`);
      onUpdate?.();
    }
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: "active" | "cancelled" | "expired" | "pending") => {
    setUpdating(subscriptionId);
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", subscriptionId);
    
    setUpdating(null);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${newStatus}`);
      onUpdate?.();
    }
  };
  const getPlanBadge = (plan: string) => {
    if (plan === "pro") {
      return (
        <Badge className="bg-accent text-accent-foreground">
          <Crown className="h-3 w-3 mr-1" /> Pro
        </Badge>
      );
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30">Active</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="text-warning border-warning/30">Cancelled</Badge>;
      case "expired":
        return <Badge variant="outline" className="text-destructive border-destructive/30">Expired</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const handleExport = () => {
    if (subscriptions.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = subscriptions.map((sub) => ({
      user_name: sub.profile?.display_name || "",
      phone: sub.profile?.phone || "",
      plan: sub.plan,
      status: sub.status,
      period_start: sub.current_period_start
        ? format(new Date(sub.current_period_start), "yyyy-MM-dd")
        : "",
      period_end: sub.current_period_end
        ? format(new Date(sub.current_period_end), "yyyy-MM-dd")
        : "",
      razorpay_id: sub.razorpay_subscription_id || "",
      created_at: format(new Date(sub.created_at), "yyyy-MM-dd"),
    }));
    exportToCsv(exportData, `subscriptions_${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Subscriptions exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Period End</TableHead>
            <TableHead>Razorpay ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No subscriptions found
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">
                  {sub.profile?.display_name || "No name"}
                </TableCell>
                <TableCell>
                  <Select
                    value={sub.plan}
                    onValueChange={(value) => handlePlanChange(sub.id, value)}
                    disabled={updating === sub.id}
                  >
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={sub.status}
                    onValueChange={(value) => handleStatusChange(sub.id, value as "active" | "cancelled" | "expired" | "pending")}
                    disabled={updating === sub.id}
                  >
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.current_period_end
                    ? format(new Date(sub.current_period_end), "MMM d, yyyy")
                    : "—"
                  }
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {sub.razorpay_subscription_id || "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
