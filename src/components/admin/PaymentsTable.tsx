import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Loader2, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { exportToCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

interface PaymentRecord {
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
    email: string | null;
    phone: string | null;
  };
}

export const PaymentsTable = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    const { data: subs, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((subs || []).map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, phone")
      .in("user_id", userIds);

    const enriched = (subs || []).map((s) => ({
      ...s,
      profile: profiles?.find((p) => p.user_id === s.user_id),
    }));

    setPayments(enriched);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-success/20 text-success border-success/30",
      cancelled: "text-warning border-warning/30",
      expired: "text-destructive border-destructive/30",
    };
    return (
      <Badge variant="outline" className={styles[status] || ""}>
        {status}
      </Badge>
    );
  };

  const getAmount = (plan: string) => {
    return plan === "pro" ? "₹499" : "₹0";
  };

  const handleExport = () => {
    if (payments.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = payments.map((p) => ({
      user: p.profile?.email || p.profile?.display_name || p.user_id.slice(0, 8),
      phone: p.profile?.phone || "",
      plan: p.plan,
      amount: p.plan === "pro" ? "499" : "0",
      status: p.status,
      period_start: p.current_period_start ? format(new Date(p.current_period_start), "yyyy-MM-dd") : "",
      period_end: p.current_period_end ? format(new Date(p.current_period_end), "yyyy-MM-dd") : "",
      razorpay_id: p.razorpay_subscription_id || "",
      created: format(new Date(p.created_at), "yyyy-MM-dd"),
    }));
    exportToCsv(exportData, `payments_${format(new Date(), "yyyy-MM-dd")}`);
    toast.success("Payments exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payments.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No payment records found.</p>;
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
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Razorpay ID</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {p.profile?.email || p.profile?.display_name || "Unknown"}
                    </span>
                    {p.profile?.phone && (
                      <span className="text-xs text-muted-foreground">{p.profile.phone}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={p.plan === "pro" ? "default" : "secondary"} className={p.plan === "pro" ? "bg-accent text-accent-foreground" : ""}>
                    {p.plan === "pro" ? "Pro" : "Free"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5 font-medium">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {p.plan === "pro" ? "499" : "0"}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(p.status)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.current_period_start && p.current_period_end
                    ? `${format(new Date(p.current_period_start), "MMM d")} – ${format(new Date(p.current_period_end), "MMM d, yyyy")}`
                    : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {p.razorpay_subscription_id || "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(p.created_at), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
