import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, IndianRupee, Award, Settings, CheckCircle2, XCircle, Clock, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Affiliate {
  id: string;
  user_id: string;
  referral_code: string;
  status: string;
  total_clicks: number;
  total_referrals: number;
  total_paid_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  withdrawn_earnings: number;
  created_at: string;
  profile?: { display_name: string | null; email: string | null };
}

interface WithdrawalRequest {
  id: string;
  affiliate_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_details: any;
  status: string;
  admin_note: string | null;
  created_at: string;
  profile?: { display_name: string | null; email: string | null };
  affiliate?: { referral_code: string };
}

interface AffSettings {
  id: string;
  commission_percent: number;
  discount_percent: number;
  min_withdrawal: number;
  is_enabled: boolean;
  attribution_window_days: number;
}

export const AffiliateManagement = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [settings, setSettings] = useState<AffSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [commissionPercent, setCommissionPercent] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [minWithdrawal, setMinWithdrawal] = useState("");
  const [allUsers, setAllUsers] = useState<{ user_id: string; display_name: string | null; email: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: affs }, { data: profs }, { data: wds }, { data: sett }] = await Promise.all([
      supabase.from("affiliates").select("*").order("total_earnings", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name, email"),
      supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliate_settings").select("*").limit(1).single(),
    ]);

    const affiliateUserIds = new Set(affs?.map(a => a.user_id) || []);
    setAllUsers((profs || []).filter(p => !affiliateUserIds.has(p.user_id)));

    setAffiliates(affs?.map(a => ({ ...a, profile: profs?.find(p => p.user_id === a.user_id) })) || []);
    
    const wdProfiles = profs || [];
    setWithdrawals(wds?.map(w => ({
      ...w,
      profile: wdProfiles.find(p => p.user_id === w.user_id),
      affiliate: affs?.find(a => a.id === w.affiliate_id),
    })) || []);

    if (sett) {
      setSettings(sett);
      setCommissionPercent(String(sett.commission_percent));
      setDiscountPercent(String(sett.discount_percent));
      setMinWithdrawal(String(sett.min_withdrawal));
    }
    setLoading(false);
  };

  const handleMakeAffiliate = async () => {
    if (!selectedUserId) { toast.error("Select a user"); return; }
    const code = `TT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { error: affError } = await supabase.from("affiliates").insert({
      user_id: selectedUserId,
      referral_code: code,
    });
    if (affError) { toast.error("Failed to create affiliate: " + affError.message); return; }

    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: selectedUserId,
      role: "affiliate" as any,
    });
    if (roleError) { toast.error("Affiliate created but role assignment failed"); }
    
    toast.success("User promoted to affiliate!");
    setSelectedUserId("");
    fetchAll();
  };

  const handleRemoveAffiliate = async (affiliateUserId: string, affiliateId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", affiliateUserId).eq("role", "affiliate");
    await supabase.from("affiliates").update({ status: "removed" }).eq("id", affiliateId);
    toast.success("Affiliate access revoked");
    fetchAll();
  };

  const handleUpdateSettings = async () => {
    if (!settings) return;
    const { error } = await supabase.from("affiliate_settings").update({
      commission_percent: Number(commissionPercent),
      discount_percent: Number(discountPercent),
      min_withdrawal: Number(minWithdrawal),
    }).eq("id", settings.id);
    
    if (error) toast.error("Failed to update settings");
    else { toast.success("Settings updated!"); fetchAll(); }
  };

  const toggleProgram = async () => {
    if (!settings) return;
    const { error } = await supabase.from("affiliate_settings").update({ is_enabled: !settings.is_enabled }).eq("id", settings.id);
    if (!error) { toast.success(settings.is_enabled ? "Program disabled" : "Program enabled"); fetchAll(); }
  };

  const handleWithdrawalAction = async (id: string, status: "approved" | "paid" | "rejected", withdrawal?: WithdrawalRequest) => {
    const { error } = await supabase.from("withdrawal_requests").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed to update withdrawal"); return; }

    // When marking as paid, update affiliate earnings
    if (status === "paid" && withdrawal) {
      const affiliate = affiliates.find(a => a.id === withdrawal.affiliate_id);
      if (affiliate) {
        await supabase.from("affiliates").update({
          withdrawn_earnings: affiliate.withdrawn_earnings + withdrawal.amount,
          pending_earnings: Math.max(0, affiliate.pending_earnings - withdrawal.amount),
          updated_at: new Date().toISOString(),
        }).eq("id", withdrawal.affiliate_id);
      }
    }

    toast.success(`Withdrawal ${status}`);
    fetchAll();
  };

  const handleSuspendAffiliate = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("affiliates").update({ status: newStatus }).eq("id", id);
    if (!error) { toast.success(`Affiliate ${newStatus}`); fetchAll(); }
  };

  const totalPayouts = affiliates.reduce((s, a) => s + a.withdrawn_earnings, 0);
  const totalPending = affiliates.reduce((s, a) => s + a.pending_earnings, 0);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { pending: "bg-yellow-500/10 text-yellow-600", approved: "bg-blue-500/10 text-blue-600", paid: "bg-green-500/10 text-green-600", rejected: "bg-red-500/10 text-red-600", active: "bg-green-500/10 text-green-600", suspended: "bg-red-500/10 text-red-600" };
    return <Badge variant="secondary" className={map[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Total Affiliates</p><p className="text-2xl font-bold">{affiliates.length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Total Payouts</p><p className="text-2xl font-bold">₹{totalPayouts.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Pending Payouts</p><p className="text-2xl font-bold">₹{totalPending.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-muted-foreground">Program Status</p><p className="text-2xl font-bold">{settings?.is_enabled ? "Active" : "Disabled"}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="affiliates"><Users className="h-4 w-4 mr-1.5" /> Affiliates</TabsTrigger>
          <TabsTrigger value="withdrawals"><IndianRupee className="h-4 w-4 mr-1.5" /> Withdrawals</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1.5" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates">
          {/* Add Affiliate Section */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-5 w-5 text-accent" /> Add New Affiliate</CardTitle>
              <CardDescription>Promote a user to affiliate status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.display_name || u.email || u.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleMakeAffiliate} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <UserPlus className="h-4 w-4 mr-1.5" /> Make Affiliate
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-accent" /> Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Referrals</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((a, i) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{a.profile?.display_name || a.profile?.email || "Unknown"}</TableCell>
                        <TableCell className="font-mono text-xs">{a.referral_code}</TableCell>
                        <TableCell>{a.total_clicks}</TableCell>
                        <TableCell>{a.total_referrals}</TableCell>
                        <TableCell>{a.total_paid_referrals}</TableCell>
                        <TableCell className="font-medium">₹{a.total_earnings.toLocaleString()}</TableCell>
                        <TableCell>{statusBadge(a.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleSuspendAffiliate(a.id, a.status)}>
                              {a.status === "suspended" ? "Activate" : "Suspend"}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveAffiliate(a.user_id, a.id)}>
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {affiliates.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No affiliates yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs">{new Date(w.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{w.profile?.display_name || w.profile?.email || "Unknown"}</TableCell>
                        <TableCell className="font-medium">₹{w.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{w.payment_method} — {w.payment_details?.upi || "-"}</TableCell>
                        <TableCell>{statusBadge(w.status)}</TableCell>
                        <TableCell>
                          {w.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="text-green-600 h-7" onClick={() => handleWithdrawalAction(w.id, "approved")}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 h-7" onClick={() => handleWithdrawalAction(w.id, "rejected")}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                          {w.status === "approved" && (
                            <Button size="sm" variant="ghost" className="text-accent h-7" onClick={() => handleWithdrawalAction(w.id, "paid")}>
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {withdrawals.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No withdrawal requests</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Affiliate Program Settings</CardTitle>
              <CardDescription>Configure commission, discount, and program rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Commission %</Label>
                <Input type="number" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} min={0} max={100} />
              </div>
              <div className="space-y-2">
                <Label>User Discount %</Label>
                <Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} min={0} max={100} />
              </div>
              <div className="space-y-2">
                <Label>Min Withdrawal (₹)</Label>
                <Input type="number" value={minWithdrawal} onChange={(e) => setMinWithdrawal(e.target.value)} min={0} />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleUpdateSettings} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Settings</Button>
                <Button variant="outline" onClick={toggleProgram}>
                  {settings?.is_enabled ? "Disable Program" : "Enable Program"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
