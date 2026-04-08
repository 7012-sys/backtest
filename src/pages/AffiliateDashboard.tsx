import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAffiliate } from "@/hooks/useAffiliate";
import { toast } from "sonner";
import { 
  Copy, Link2, Users, IndianRupee, TrendingUp, MousePointer, 
  Wallet, Award, Star, Zap, ArrowUpRight, Edit3, CheckCircle2,
  History, Receipt
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const { 
    affiliate, settings, dailyClicks, loading: affLoading, isAffiliate,
    becomeAffiliate, updatePaymentInfo, updateReferralCode, requestWithdrawal, refresh
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

  // Fetch commissions and withdrawals
  useEffect(() => {
    if (!affiliate) return;
    const fetchHistory = async () => {
      const [{ data: comms }, { data: wds }] = await Promise.all([
        supabase.from("commissions").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
        supabase.from("withdrawal_requests").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false }),
      ]);
      setCommissions(comms || []);
      setWithdrawals(wds || []);
    };
    fetchHistory();
  }, [affiliate]);

  const handleBecomeAffiliate = async () => {
    const result = await becomeAffiliate();
    if (result?.error) {
      toast.error("Failed to join affiliate program");
    } else {
      toast.success("Welcome to the Affiliate Program! 🎉");
    }
  };

  const handleCopyLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const handleCopyCode = () => {
    if (!affiliate) return;
    navigator.clipboard.writeText(affiliate.referral_code);
    toast.success("Referral code copied!");
  };

  const handleUpdateCode = async () => {
    if (!newCode.trim() || newCode.length < 4) {
      toast.error("Code must be at least 4 characters");
      return;
    }
    const result = await updateReferralCode(newCode.toUpperCase());
    if (result?.error) {
      toast.error(result.error.message || "Failed to update code");
    } else {
      toast.success("Referral code updated!");
      setEditingCode(false);
    }
  };

  const handleSavePayment = async () => {
    const result = await updatePaymentInfo({ payment_upi: upi });
    if (result?.error) {
      toast.error("Failed to save payment info");
    } else {
      toast.success("Payment info saved!");
    }
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt < (settings?.min_withdrawal || 1000)) {
      toast.error(`Minimum withdrawal is ₹${settings?.min_withdrawal || 1000}`);
      return;
    }
    if (amt > (affiliate?.pending_earnings || 0)) {
      toast.error("Insufficient pending earnings");
      return;
    }
    const result = await requestWithdrawal(amt, "upi", { upi });
    if (result?.error) {
      toast.error("Failed to submit withdrawal request");
    } else {
      toast.success("Withdrawal request submitted!");
      setWithdrawAmount("");
    }
  };

  const conversionRate = affiliate && affiliate.total_clicks > 0 
    ? ((affiliate.total_paid_referrals / affiliate.total_clicks) * 100).toFixed(1) 
    : "0";

  const topDay = dailyClicks.reduce((max, d) => d.clicks > max.clicks ? d : max, { date: "-", clicks: 0 });

  if (loading || affLoading) {
    return <AppLayout loading={true} title="Affiliate"><div /></AppLayout>;
  }

  // Not an affiliate - redirect
  if (!isAffiliate) {
    return (
      <AppLayout showBack backTo="/dashboard" title="Access Denied">
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold font-heading mb-2">Affiliate Access Required</h2>
            <p className="text-muted-foreground mb-4">
              You don't have affiliate access. Please contact the admin to get approved as an affiliate.
            </p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout showBack backTo="/dashboard" title="Affiliate Dashboard" subtitle="Track your referrals & earnings">
      <div className="space-y-6">
        {/* Referral Link Card */}
        <Card className="border-accent/20">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Your Referral Link</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {window.location.origin}?ref={affiliate!.referral_code}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopyCode}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Code
                </Button>
                <Button size="sm" onClick={handleCopyLink} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Link
                </Button>
              </div>
            </div>
            {!affiliate!.code_edited && (
              <div className="mt-3 pt-3 border-t border-border">
                {editingCode ? (
                  <div className="flex gap-2 items-center">
                    <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="NEW_CODE" className="max-w-[200px] font-mono uppercase" maxLength={20} />
                    <Button size="sm" onClick={handleUpdateCode}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCode(false)}>Cancel</Button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingCode(true); setNewCode(affiliate!.referral_code); }} className="text-xs text-accent hover:underline flex items-center gap-1">
                    <Edit3 className="h-3 w-3" /> Edit referral code (one-time only)
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Clicks</span>
              </div>
              <p className="text-2xl font-bold">{affiliate!.total_clicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Referrals</span>
              </div>
              <p className="text-2xl font-bold">{affiliate!.total_referrals}</p>
              <p className="text-xs text-muted-foreground">{affiliate!.total_paid_referrals} paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="h-4 w-4 text-accent" />
                <span className="text-xs text-muted-foreground">Total Earned</span>
              </div>
              <p className="text-2xl font-bold text-accent">₹{affiliate!.total_earnings.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
              <p className="text-2xl font-bold">₹{affiliate!.pending_earnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">₹{affiliate!.withdrawn_earnings.toLocaleString()} withdrawn</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="payment">Payment Info</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
                  <p className="text-xl font-bold text-accent">{conversionRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Revenue Generated</p>
                  <p className="text-xl font-bold">₹{affiliate!.total_earnings.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Top Day</p>
                  <p className="text-xl font-bold">{topDay.clicks} clicks</p>
                  <p className="text-xs text-muted-foreground">{topDay.date !== "-" ? new Date(topDay.date).toLocaleDateString() : "-"}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Daily Clicks (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyClicks}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleDateString()} />
                    <Bar dataKey="clicks" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Withdrawal</CardTitle>
                <CardDescription>Minimum withdrawal: ₹{settings?.min_withdrawal || 1000}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 text-sm">
                  <div className="flex-1 p-3 rounded-lg bg-muted">
                    <p className="text-muted-foreground text-xs">Available</p>
                    <p className="font-bold text-lg">₹{affiliate!.pending_earnings.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-muted">
                    <p className="text-muted-foreground text-xs">Total Withdrawn</p>
                    <p className="font-bold text-lg">₹{affiliate!.withdrawn_earnings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder={`Min ₹${settings?.min_withdrawal || 1000}`} />
                </div>
                <Button onClick={handleWithdraw} disabled={!withdrawAmount || Number(withdrawAmount) < (settings?.min_withdrawal || 1000)} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <ArrowUpRight className="h-4 w-4 mr-2" /> Request Withdrawal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
                <CardDescription>Add your UPI ID for receiving payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@upi" />
                </div>
                <Button onClick={handleSavePayment} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Save Payment Info
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-accent" /> Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {affiliate!.total_referrals >= 1 && (
                <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> First Referral</Badge>
              )}
              {affiliate!.total_paid_referrals >= 5 && (
                <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent border-accent/30"><TrendingUp className="h-3 w-3" /> Rising Star</Badge>
              )}
              {affiliate!.total_paid_referrals >= 20 && (
                <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Award className="h-3 w-3" /> Top Influencer</Badge>
              )}
              {affiliate!.total_earnings >= 10000 && (
                <Badge variant="secondary" className="gap-1 bg-purple-500/10 text-purple-600 border-purple-500/30"><Zap className="h-3 w-3" /> Power Affiliate</Badge>
              )}
              {affiliate!.total_referrals === 0 && (
                <p className="text-sm text-muted-foreground">Share your link to earn your first badge!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AffiliateDashboard;
