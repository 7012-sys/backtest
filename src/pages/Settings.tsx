import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User as UserIcon,
  CreditCard,
  Settings as SettingsIcon,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Crown,
  IndianRupee,
  TrendingUp,
  Clock,
  Shield,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";


interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  default_capital: number | null;
  trading_preference: 'intraday' | 'swing' | 'long_term' | null;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | null;
  onboarding_completed: boolean | null;
}

interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  current_period_end: string | null;
}

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultCapital, setDefaultCapital] = useState("100000");
  const [tradingPreference, setTradingPreference] = useState<string>("intraday");
  const [experienceLevel, setExperienceLevel] = useState<string>("beginner");
  
  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null);


  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => authSub.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } else if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setPhone(data.phone || "");
      setDefaultCapital(String(data.default_capital || 100000));
      setTradingPreference(data.trading_preference || "intraday");
      setExperienceLevel(data.experience_level || "beginner");
    }
    setLoading(false);
  };

  const fetchSubscription = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setSubscription(data);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          phone: phone.trim() || null,
          default_capital: parseFloat(defaultCapital) || 100000,
          trading_preference: tradingPreference as Profile['trading_preference'],
          experience_level: experienceLevel as Profile['experience_level'],
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };



  const getPlanBadge = (plan: string) => {
    if (plan === 'pro') {
      return <Badge className="bg-accent text-accent-foreground"><Crown className="h-3 w-3 mr-1" /> Pro</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-warning border-warning/30"><AlertCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-destructive border-destructive/30"><AlertCircle className="h-3 w-3 mr-1" /> Expired</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <AppLayout 
      loading={loading} 
      showBack 
      backTo="/dashboard"
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full max-w-md ${user?.email === 'dharnekunal2002@gmail.com' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          {user?.email === 'dharnekunal2002@gmail.com' && (
            <TabsTrigger value="admin" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-accent" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                />
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Sign Out</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                Current Plan
              </CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    {subscription?.plan === 'pro' ? (
                      <Crown className="h-6 w-6 text-accent" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getPlanBadge(subscription?.plan || 'free')}
                      {subscription && getStatusBadge(subscription.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.plan === 'pro' 
                        ? 'Unlimited strategies, All stocks + CSV, Unlimited backtests, Full analytics' 
                        : '10 Manual Strategies, 5 Preloaded NSE Stocks, 5 Backtests/Month, Basic Analytics'}
                    </p>
                  </div>
                </div>
              </div>

              {subscription?.current_period_end && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {subscription.status === 'active' 
                    ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                    : `Expires on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  }
                </div>
              )}

              <Separator />

              {subscription?.plan !== 'pro' && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-accent" />
                        Upgrade to Pro
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-accent" /> Unlimited strategies
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-accent" /> All stocks + CSV uploads
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-accent" /> Unlimited backtests
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-accent" /> Full analytics & exports
                        </li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => navigate("/upgrade")}
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Crown className="h-4 w-4 mr-1" />
                      ₹499 / Month
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Trading Preferences
              </CardTitle>
              <CardDescription>Customize your default trading settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultCapital" className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  Default Capital
                </Label>
                <Input
                  id="defaultCapital"
                  type="number"
                  value={defaultCapital}
                  onChange={(e) => setDefaultCapital(e.target.value)}
                  min="10000"
                  step="10000"
                />
                <p className="text-xs text-muted-foreground">Initial capital for new backtests</p>
              </div>

              <div className="space-y-2">
                <Label>Trading Style</Label>
                <Select value={tradingPreference} onValueChange={setTradingPreference}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intraday">Intraday</SelectItem>
                    <SelectItem value="swing">Swing Trading</SelectItem>
                    <SelectItem value="long_term">Long Term</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Your preferred trading style</p>
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Helps us tailor recommendations</p>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Data & Privacy
              </CardTitle>
              <CardDescription>Manage your data preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Export Data</p>
                  <p className="text-xs text-muted-foreground">Download your profile, strategies, backtests, journals & CSV references</p>
                </div>
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!user) return;
                  try {
                    const [profileRes, strategiesRes, backtestsRes, journalsRes, filesRes] = await Promise.all([
                      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
                      supabase.from("strategies").select("*").eq("user_id", user.id),
                      supabase.from("backtests").select("*").eq("user_id", user.id),
                      supabase.from("strategy_journals").select("*").eq("user_id", user.id),
                      supabase.from("uploaded_files").select("*").eq("user_id", user.id),
                    ]);
                    const exportData = {
                      exported_at: new Date().toISOString(),
                      profile: profileRes.data,
                      strategies: strategiesRes.data || [],
                      backtests: backtestsRes.data || [],
                      journals: journalsRes.data || [],
                      uploaded_files: filesRes.data || [],
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                    toast.success("Data exported successfully!");
                  } catch (err) {
                    toast.error("Failed to export data");
                  }
                }}>Export</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Delete Account & Data</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={async () => {
                    if (!user) return;
                    const confirmed = window.confirm("Are you sure you want to delete your account and ALL data? This action cannot be undone.");
                    if (!confirmed) return;
                    const doubleConfirm = window.confirm("This will permanently delete your profile, strategies, backtests, journals, and uploaded files. Type OK to confirm.");
                    if (!doubleConfirm) return;
                    try {
                      // Delete user data in order (child tables first)
                      await supabase.from("strategy_journals").delete().eq("user_id", user.id);
                      await supabase.from("backtests").delete().eq("user_id", user.id);
                      await supabase.from("strategies").delete().eq("user_id", user.id);
                      await supabase.from("uploaded_files").delete().eq("user_id", user.id);
                      await supabase.from("experiment_history").delete().eq("user_id", user.id);
                      await supabase.from("data_versions").delete().eq("user_id", user.id);
                      await supabase.from("feedback").delete().eq("user_id", user.id);
                      await supabase.from("user_consents").delete().eq("user_id", user.id);
                      await supabase.from("strategy_health").delete().eq("user_id", user.id);
                      await supabase.from("subscriptions").delete().eq("user_id", user.id);
                      await supabase.from("profiles").delete().eq("user_id", user.id);
                      await supabase.auth.signOut();
                      toast.success("Account deleted successfully");
                      navigate("/");
                    } catch (err) {
                      toast.error("Failed to delete account. Please contact support.");
                    }
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Admin Tab - only for dharnekunal2002@gmail.com */}
        {user?.email === 'dharnekunal2002@gmail.com' && (
          <TabsContent value="admin" className="space-y-6">
            <Card className="border-border shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  Admin Panel
                </CardTitle>
                <CardDescription>Access administrative tools</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate("/admin")}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Open Admin Dashboard
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </AppLayout>
  );
};

export default Settings;
