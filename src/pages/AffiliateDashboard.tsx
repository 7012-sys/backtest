import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAffiliate } from "@/hooks/useAffiliate";
import { toast } from "sonner";
import {
  Copy, Link2, Users, IndianRupee, TrendingUp,
  Wallet, Award, Star, Zap, ArrowUpRight, Edit3, CheckCircle2,
  Bell, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const AffiliateDashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [editingCode, setEditingCode] = useState(false);
  const [upi, setUpi] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState<Notification | null>(null);
  const [withdrawalFilter, setWithdrawalFilter] = useState<"all" | "pending" | "paid">("all");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const {
    affiliate, settings, loading: affLoading,
    updatePaymentInfo, updateReferralCode, requestWithdrawal, refresh
  } = useAffiliate(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUserId(session.user.id);
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    if (affiliate?.payment_upi) setUpi(affiliate.payment_upi);
  }, [affiliate]);

  useEffect(() => {
    if (!affiliate) return;
    const fetchHistory = async () => {
      const [{ data: comms }, { data: wds }, { data: notifs }] = await Promise.all([
        supabase.from("commissions").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
        supabase.from("withdrawal_requests").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
        supabase.from("affiliate_notifications").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setCommissions(comms || []);
      setWithdrawals(wds || []);
      setNotifications((notifs as Notification[]) || []);
      const unread = (notifs as Notification[] || []).find(n => !n.is_read);
      if (unread) setShowNotification(unread);
    };
    fetchHistory();
  }, [affiliate]);

  const handleDismissNotification = async () => {
    if (showNotification) {
      await supabase.from("affiliate_notifications").update({ is_read: true }).eq("id", showNotification.id);
      setShowNotification(null);
      setNotifications(prev => prev.map(x => x.id === showNotification.id ? { ...x, is_read: true } : x));
      const nextUnread = notifications.find(n => !n.is_read && n.id !== showNotification.id);
      if (nextUnread) setTimeout(() => setShowNotification(nextUnread), 300);
    }
  };

  const handleCopyLink = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(`${window.location.origin}?ref=${affiliate.referral_code}`);
    toast.success("Referral link copied!");
  };

  const handleCopyCode = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(affiliate.referral_code);
    toast.success("Referral code copied!");
  };

  const handleUpdateCode = async () => {
    if (!newCode.trim() || newCode.length < 4) { toast.error("Code must be at least 4 characters"); return; }
    const result = await updateReferralCode(newCode.toUpperCase());
    if (result?.error) toast.error(result.error.message || "Failed to update code");
    else { toast.success("Referral code updated!"); setEditingCode(false); }
  };

  const handleSavePayment = async () => {
    if (!upi.trim() || !upi.includes("@")) { toast.error("Please enter a valid UPI ID (e.g. name@bank)"); return; }
    const result = await updatePaymentInfo({ payment_upi: upi });
    if (result?.error) toast.error("Failed to save payment info");
    else toast.success("UPI ID saved successfully!");
  };

  const handleWithdraw = async () => {
    if (!affiliate?.payment_upi && !upi.includes("@")) {
      toast.error("UPI ID is required. Please save your UPI first.");
      return;
    }
    const amt = Number(withdrawAmount);
    if (!amt || amt < (settings?.min_withdrawal || 1000)) {
      toast.error(`Minimum withdrawal is ₹${settings?.min_withdrawal || 1000}`);
      return;
    }
    if (amt > availableBalance) { toast.error("Insufficient balance"); return; }
    const hasPending = withdrawals.some(w => w.status === "pending" || w.status === "approved");
    if (hasPending) { toast.error("You already have a pending request. Please wait."); return; }
    const upiToUse = affiliate?.payment_upi || upi;
    const result = await requestWithdrawal(amt, "upi", { upi: upiToUse });
    if (result?.error) toast.error("Failed to submit withdrawal request");
    else { toast.success("Withdrawal request submitted!"); setWithdrawAmount(""); refresh(); }
  };

  const processingAmount = withdrawals
    .filter(w => w.status === "pending" || w.status === "approved")
    .reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = Math.max(0, (affiliate?.pending_earnings || 0) - processingAmount);
  const hasPendingRequest = withdrawals.some(w => w.status === "pending" || w.status === "approved");
  const conversionRate = affiliate && affiliate.total_clicks > 0
    ? ((affiliate.total_paid_referrals / affiliate.total_clicks) * 100).toFixed(1) : "0";
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredWithdrawals = withdrawals.filter(w => {
    if (withdrawalFilter === "all") return true;
    if (withdrawalFilter === "pending") return w.status === "pending" || w.status === "approved";
    return w.status === "paid";
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
      approved: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      rejected: "bg-red-500/10 text-red-500 border-red-500/30",
    };
    return <Badge variant="outline" className={`text-xs capitalize ${styles[status] || ""}`}>{status}</Badge>;
  };

  if (loading || affLoading) {
    return (
      <AppLayout loading={false} title="Affiliate Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!affiliate) {
    return (
      <AppLayout showBack backTo="/dashboard" title="Access Denied">
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Affiliate Access Required</h2>
            <p className="text-muted-foreground mb-4">Contact the admin to get approved as an affiliate.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack backTo="/dashboard" title="Affiliate Dashboard">
      {/* Notification Popup */}
      <Dialog open={!!showNotification} onOpenChange={() => handleDismissNotification()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {showNotification?.title}
            </DialogTitle>
            <DialogDescription className="pt-2">{showNotification?.message}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">
              {showNotification ? new Date(showNotification.created_at).toLocaleString() : ""}
            </span>
            <Button size="sm" onClick={handleDismissNotification}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Section 1: Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6 pb-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-foreground">₹{affiliate.total_earnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{affiliate.total_paid_referrals} paid referrals</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6 pb-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-foreground">₹{availableBalance.toLocaleString()}</p>
              {processingAmount > 0 && (
                <p className="text-xs text-yellow-600 mt-1">₹{processingAmount.toLocaleString()} processing</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6 pb-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Withdrawn</p>
              <p className="text-3xl font-bold text-foreground">₹{affiliate.withdrawn_earnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{withdrawals.filter(w => w.status === "paid").length} withdrawals</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Quick Action — Withdrawal */}
        <Card className="border-0 shadow-md">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-sm">Request Withdrawal</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Min ₹{settings?.min_withdrawal || 1000} · UPI ID required
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`₹${settings?.min_withdrawal || 1000}`}
                  disabled={!affiliate.payment_upi || hasPendingRequest}
                  className="w-full sm:w-36"
                />
                <Button
                  onClick={handleWithdraw}
                  disabled={
                    !affiliate.payment_upi ||
                    hasPendingRequest ||
                    !withdrawAmount ||
                    Number(withdrawAmount) < (settings?.min_withdrawal || 1000) ||
                    Number(withdrawAmount) > availableBalance
                  }
                  className="shrink-0"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1.5" /> Withdraw
                </Button>
              </div>
            </div>
            {!affiliate.payment_upi && (
              <p className="text-xs text-destructive mt-3">⚠️ Save your UPI ID below before requesting a withdrawal.</p>
            )}
            {hasPendingRequest && (
              <p className="text-xs text-yellow-600 mt-3">⏳ A withdrawal is already being processed.</p>
            )}
          </CardContent>
        </Card>

        {/* UPI Setup (show only if not set) */}
        {!affiliate.payment_upi && (
          <Card className="border-destructive/20 shadow-md border-0">
            <CardContent className="py-5">
              <h3 className="font-semibold text-sm mb-3">Setup UPI ID</h3>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">UPI ID <span className="text-destructive">*</span></Label>
                  <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@bank" />
                  {upi && !upi.includes("@") && <p className="text-xs text-destructive">Invalid format (e.g. name@bank)</p>}
                </div>
                <Button onClick={handleSavePayment} disabled={!upi.includes("@")} className="shrink-0">
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 3: Referral Link + Quick Stats */}
        <Card className="border-0 shadow-md">
          <CardContent className="py-5">
            <div className="flex flex-col gap-4">
              {/* Referral link */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">Your Referral Link</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {window.location.origin}?ref={affiliate.referral_code}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={handleCopyCode}><Copy className="h-3.5 w-3.5 mr-1" /> Code</Button>
                  <Button size="sm" onClick={handleCopyLink}><Copy className="h-3.5 w-3.5 mr-1" /> Link</Button>
                </div>
              </div>

              {!affiliate.code_edited && (
                <div className="border-t border-border pt-3">
                  {editingCode ? (
                    <div className="flex gap-2 items-center">
                      <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="NEW_CODE" className="max-w-[180px] font-mono uppercase" maxLength={20} />
                      <Button size="sm" onClick={handleUpdateCode}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCode(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingCode(true); setNewCode(affiliate.referral_code); }} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Edit3 className="h-3 w-3" /> Edit code (one-time only)
                    </button>
                  )}
                </div>
              )}

              {/* Quick stats row */}
              <div className="border-t border-border pt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold">{affiliate.total_clicks}</p>
                  <p className="text-xs text-muted-foreground">Clicks</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{affiliate.total_referrals}</p>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{conversionRate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Withdrawal History */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Withdrawal History</CardTitle>
              <div className="flex gap-1">
                {(["all", "pending", "paid"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setWithdrawalFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${withdrawalFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {f === "all" ? "All" : f === "pending" ? "Pending" : "Paid"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-10">
                <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No withdrawals yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">UPI ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">₹{w.amount.toLocaleString()}</TableCell>
                        <TableCell>{statusBadge(w.status)}</TableCell>
                        <TableCell className="text-xs font-mono hidden sm:table-cell">{w.payment_details?.upi || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 5: Commission History */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Commission History</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {commissions.length === 0 ? (
              <div className="text-center py-10">
                <IndianRupee className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No commissions yet. Share your link to start earning!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize text-sm">{c.plan_purchased}</TableCell>
                        <TableCell className="font-semibold text-primary">₹{c.commission_amount.toLocaleString()}</TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 6: Notifications */}
        {notifications.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Messages</CardTitle>
                {unreadCount > 0 && (
                  <Badge className="text-[10px] h-5">{unreadCount} new</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className={`p-3 rounded-lg border ${n.is_read ? "bg-muted/30 border-border" : "bg-primary/5 border-primary/20"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{n.title}</p>
                        {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && (
                      <Button
                        size="sm" variant="ghost" className="h-7 text-xs shrink-0"
                        onClick={async () => {
                          await supabase.from("affiliate_notifications").update({ is_read: true }).eq("id", n.id);
                          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                        }}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Payment Info (if UPI is set, show as compact) */}
        {affiliate.payment_upi && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Payment UPI</p>
                  <p className="text-sm font-mono mt-0.5">{affiliate.payment_upi}</p>
                </div>
                <div className="flex gap-2 items-end">
                  <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@bank" className="w-48" />
                  <Button size="sm" variant="outline" onClick={handleSavePayment} disabled={!upi.includes("@")}>
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View More: Analytics */}
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAnalytics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showAnalytics ? "Hide Details" : "View More Details"}
        </button>

        {showAnalytics && (
          <div className="space-y-4">
            {/* Badges */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Badges</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {affiliate.total_referrals >= 1 && <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> First Referral</Badge>}
                  {affiliate.total_paid_referrals >= 5 && <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/30"><TrendingUp className="h-3 w-3" /> Rising Star</Badge>}
                  {affiliate.total_paid_referrals >= 20 && <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Award className="h-3 w-3" /> Top Influencer</Badge>}
                  {affiliate.total_earnings >= 10000 && <Badge variant="secondary" className="gap-1 bg-purple-500/10 text-purple-600 border-purple-500/30"><Zap className="h-3 w-3" /> Power Affiliate</Badge>}
                  {affiliate.total_referrals === 0 && <p className="text-sm text-muted-foreground">Share your link to earn your first badge!</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AffiliateDashboard;
