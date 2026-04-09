import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats } from "@/components/admin/AdminStats";
import { UsersTable } from "@/components/admin/UsersTable";
import { SubscriptionsTable } from "@/components/admin/SubscriptionsTable";
import { UsageChart } from "@/components/admin/UsageChart";
import { FeedbackTable } from "@/components/admin/FeedbackTable";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Users, CreditCard, BarChart3, AlertTriangle, MessageSquare, Wallet } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfDay } from "date-fns";

interface UserWithSubscription {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  subscription?: { plan: string; status: string };
  role?: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  razorpay_subscription_id: string | null;
  profile?: { display_name: string | null; phone: string | null; email: string | null };
}

interface UsageData {
  date: string;
  backtests: number;
  strategies: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, proUsers: 0, totalBacktests: 0, totalStrategies: 0 });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Access denied.");
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchSubscriptions(), fetchStats(), fetchUsageData()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: subs } = await supabase.from("subscriptions").select("user_id, plan, status");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    setUsers(
      profiles?.map((p) => ({
        ...p,
        subscription: subs?.find((s) => s.user_id === p.user_id),
        role: roles?.find((r) => r.user_id === p.user_id)?.role,
      })) || []
    );
  };

  const fetchSubscriptions = async () => {
    const { data: subs } = await supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, phone, email");
    setSubscriptions(subs?.map((sub) => ({ ...sub, profile: profiles?.find((p) => p.user_id === sub.user_id) })) || []);
  };

  const fetchStats = async () => {
    const [{ count: usersCount }, { count: proCount }, { count: backtestsCount }, { count: strategiesCount }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("plan", "pro").eq("status", "active"),
      supabase.from("backtests").select("*", { count: "exact", head: true }),
      supabase.from("strategies").select("*", { count: "exact", head: true }),
    ]);
    setStats({ totalUsers: usersCount || 0, proUsers: proCount || 0, totalBacktests: backtestsCount || 0, totalStrategies: strategiesCount || 0 });
  };

  const fetchUsageData = async () => {
    const days = 14;
    const usageByDate: Record<string, { backtests: number; strategies: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      usageByDate[format(subDays(new Date(), i), "MMM d")] = { backtests: 0, strategies: 0 };
    }
    const since = startOfDay(subDays(new Date(), days - 1)).toISOString();
    const [{ data: backtests }, { data: strategies }] = await Promise.all([
      supabase.from("backtests").select("created_at").gte("created_at", since),
      supabase.from("strategies").select("created_at").gte("created_at", since),
    ]);
    backtests?.forEach((bt) => { const d = format(new Date(bt.created_at), "MMM d"); if (usageByDate[d]) usageByDate[d].backtests++; });
    strategies?.forEach((st) => { const d = format(new Date(st.created_at), "MMM d"); if (usageByDate[d]) usageByDate[d].strategies++; });
    setUsageData(Object.entries(usageByDate).map(([date, data]) => ({ date, ...data })));
  };

  if (adminLoading) {
    return <AppLayout loading={true} title="Admin"><div /></AppLayout>;
  }

  if (!isAdmin) {
    return (
      <AppLayout title="Access Denied">
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin" subtitle="Manage users & analytics" showBack backTo="/dashboard">
      <div className="space-y-6">
        <AdminStats {...stats} />

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5">
              <CreditCard className="h-4 w-4" /> Subs
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5">
              <Wallet className="h-4 w-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTable users={users} loading={loading} onRefresh={fetchAllData} />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsTable subscriptions={subscriptions} loading={loading} onUpdate={fetchSubscriptions} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTable />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTable />
          </TabsContent>

          <TabsContent value="analytics">
            <UsageChart data={usageData} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Admin;
