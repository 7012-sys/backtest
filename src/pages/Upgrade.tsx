import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  CheckCircle2, 
  Loader2, 
  IndianRupee,
  Zap,
  TrendingUp,
  BarChart3,
  Shield,
  X,
  Sparkles,
  LineChart,
  Download,
  Upload,
  HelpCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  current_period_end: string | null;
}

const proFeatures = [
  { icon: Zap, title: "Unlimited Simulations", description: "Run as many historical simulations as you want, no monthly limits" },
  { icon: TrendingUp, title: "AI Strategy Generation", description: "Generate up to 50 strategies/day from plain English descriptions" },
  { icon: BarChart3, title: "20+ Indian Stocks", description: "HDFCBANK, TATAMOTORS, ADANIENT, POWERGRID & more built-in" },
  { icon: Shield, title: "Custom CSV Upload (50MB)", description: "Upload your own historical data for educational analysis" },
  { icon: LineChart, title: "Walk-Forward Validation", description: "Detect overfitting with rolling train/test windows" },
  { icon: Sparkles, title: "Custom Indicator Parameters", description: "Tune SMA, RSI, MACD periods to any value you want" },
  { icon: Upload, title: "Community Strategy Sharing", description: "Share, browse, like & apply strategies from other users" },
  { icon: Download, title: "PDF & Excel Export", description: "Export complete simulation reports and analysis logs" },
];

interface ComparisonRowProps {
  feature: string;
  free?: string;
  pro?: string;
  freeCheck?: boolean;
  proCheck?: boolean;
  freeCross?: boolean;
  proHighlight?: boolean;
  isLast?: boolean;
}

const ComparisonRow = ({ 
  feature, 
  free, 
  pro, 
  freeCheck, 
  proCheck, 
  freeCross,
  proHighlight,
  isLast 
}: ComparisonRowProps) => (
  <div className={`grid grid-cols-3 gap-4 px-4 py-3 ${!isLast ? 'border-b border-border/50' : ''}`}>
    <div className="text-sm text-foreground">{feature}</div>
    <div className="flex justify-center">
      {freeCheck ? (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ) : freeCross ? (
        <X className="h-5 w-5 text-muted-foreground/50" />
      ) : (
        <span className="text-sm text-muted-foreground">{free}</span>
      )}
    </div>
    <div className="flex justify-center">
      {proCheck ? (
        <CheckCircle2 className="h-5 w-5 text-accent" />
      ) : (
        <span className={`text-sm ${proHighlight ? 'text-accent font-medium' : 'text-foreground'}`}>
          {pro}
        </span>
      )}
    </div>
  </div>
);

const Upgrade = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
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
      setLoading(false);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => authSub.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setSubscription(data);
      // If already pro, redirect to dashboard
      if (data.plan === 'pro' && data.status === 'active') {
        toast.success("You're already a Pro member!");
        navigate("/dashboard");
      }
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (!user) {
      toast.error("Please sign in to upgrade");
      navigate("/auth");
      return;
    }

    setUpgrading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load payment gateway");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }

      const { data, error } = await supabase.functions.invoke("create-razorpay-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      {
        // Always use inline Razorpay checkout modal
        const options = {
          key: data.key_id,
          subscription_id: data.subscription_id,
          name: "Trade Strategy Backtester",
          description: "Pro Plan - ₹499/month",
          handler: async function (response: any) {
            toast.success("Payment successful! Activating Pro plan...");
            // Update subscription status - 30 days (1 month)
            await supabase
              .from("subscriptions")
              .update({ 
                plan: 'pro', 
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .eq("user_id", user.id);
            
            // Navigate to success page
            navigate("/upgrade/success");
          },
          prefill: {
            email: user.email,
          },
          theme: {
            color: "#10B981",
          },
          modal: {
            ondismiss: function() {
              setUpgrading(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast.error(error.message || "Failed to start upgrade process");
      setUpgrading(false);
    }
  };

  if (subscription?.plan === 'pro' && subscription?.status === 'active') {
    return (
      <AppLayout loading={loading} showBack backTo="/dashboard" title="Pro Member" subtitle="You have full access">
        <Card className="border-accent/30 bg-accent/5 max-w-lg mx-auto">
          <CardContent className="py-8 text-center">
            <Crown className="h-16 w-16 mx-auto mb-4 text-accent" />
            <h2 className="text-2xl font-bold mb-2">You're a Pro Member!</h2>
            <p className="text-muted-foreground mb-6">Enjoy unlimited backtests, AI strategies, and all Pro features.</p>
            <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      loading={loading} 
      showBack 
      backTo="/dashboard"
      title="Upgrade to Pro"
      subtitle="Unlock all features and remove limits"
    >
      <div className="max-w-4xl mx-auto">
        {/* Hero Card */}
        <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5 mb-8">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <Badge className="bg-accent text-accent-foreground mb-4">
                  <Crown className="h-3 w-3 mr-1" /> Pro Plan
                </Badge>
                <h1 className="text-3xl font-bold font-heading mb-2">
                  Remove All Limits
                </h1>
                <p className="text-muted-foreground max-w-md">
                  Get unlimited backtests, AI strategies, and access to all stocks and features.
                </p>
              </div>
              <div className="text-center">
                <Badge className="bg-success/10 text-success border-success/20 mb-3">
                  50% OFF — Limited Time
                </Badge>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <span className="text-xl text-muted-foreground line-through flex items-center">
                    <IndianRupee className="h-4 w-4" />999
                  </span>
                </div>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <IndianRupee className="h-8 w-8 text-accent" />
                  <span className="text-6xl font-bold font-heading text-accent">499</span>
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  per <span className="font-semibold text-foreground">month</span> access
                </div>
                <Button 
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade Now
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  🔒 All payments are final. No refunds applicable. Educational tool only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <h2 className="text-xl font-semibold font-heading mb-4">What You'll Get with Pro</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {proFeatures.map((feature) => (
            <Card key={feature.title} className="border-border">
              <CardContent className="py-4">
                <div className="flex flex-col gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="border-border overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">Compare Plans</CardTitle>
            <CardDescription>See what's included in each plan</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-sm font-medium text-muted-foreground">Feature</div>
              <div className="text-center">
                <div className="inline-flex flex-col items-center px-4 py-2 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Free</span>
                  <span className="text-xs text-muted-foreground">₹0</span>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex flex-col items-center px-4 py-2 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-accent" />
                    <span className="text-sm font-medium text-accent">Pro</span>
                  </div>
                  <span className="text-xs text-muted-foreground">₹499/month</span>
                </div>
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-0 border rounded-lg overflow-hidden">
              {/* Strategies Section */}
              <div className="bg-muted/30 px-4 py-2 border-b">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-3 w-3" /> Strategies
                </span>
              </div>
              <ComparisonRow feature="Manual Strategies" free="2 max" pro="Unlimited" proHighlight />
              <ComparisonRow feature="All 15+ Indicators" freeCheck proCheck />
              <ComparisonRow feature="Custom Indicator Parameters" freeCheck proCheck />
              <ComparisonRow feature="Strategy Versioning" freeCheck proCheck />
              <ComparisonRow feature="AI Strategy Generation" freeCross pro="50/day" proHighlight />

              {/* Backtesting Section */}
              <div className="bg-muted/30 px-4 py-2 border-b border-t">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <LineChart className="h-3 w-3" /> Backtesting
                </span>
              </div>
              <ComparisonRow feature="Monthly Backtests" free="30 / month" pro="Unlimited" proHighlight />
              <ComparisonRow feature="Market Data" free="NIFTY50 only" pro="20+ Indian Stocks" proHighlight />
              <ComparisonRow feature="Custom CSV Upload" freeCross proCheck />
              <ComparisonRow feature="Timeframes" free="Daily only" pro="All (1m–1M)" proHighlight />
              <ComparisonRow feature="Walk-Forward Validation" freeCross proCheck />

              {/* Community Section */}
              <div className="bg-muted/30 px-4 py-2 border-b border-t">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Community
                </span>
              </div>
              <ComparisonRow feature="Browse Community Strategies" freeCheck proCheck />
              <ComparisonRow feature="Like & Upvote Strategies" freeCheck proCheck />
              <ComparisonRow feature="Share Strategies" freeCheck proCheck />
              <ComparisonRow feature="Apply Community Strategies" freeCheck proCheck />

              {/* Analytics Section */}
              <div className="bg-muted/30 px-4 py-2 border-b border-t">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Analytics & Results
                </span>
              </div>
              <ComparisonRow feature="Basic Overview (Win Rate, P&L)" freeCheck proCheck />
              <ComparisonRow feature="Equity Curve" freeCheck proCheck />
              <ComparisonRow feature="Key Performance Metrics" freeCheck proCheck />
              <ComparisonRow feature="Monthly Returns Chart" freeCross proCheck />
              <ComparisonRow feature="Trade-by-Trade Analysis" freeCross proCheck />
              <ComparisonRow feature="Learning Mode" freeCross proCheck />
              <ComparisonRow feature="Advanced Metrics (Sharpe, CAGR…)" freeCross proCheck />

              {/* Import/Export Section */}
              <div className="bg-muted/30 px-4 py-2 border-b border-t">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Download className="h-3 w-3" /> Export
                </span>
              </div>
              <ComparisonRow feature="Export PDF Report" freeCross proCheck />
              <ComparisonRow feature="Export Excel / CSV" freeCross proCheck />

              {/* Upcoming Section */}
              <div className="bg-muted/30 px-4 py-2 border-b border-t">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Coming Soon
                </span>
              </div>
              <ComparisonRow feature="Strategy Comparison Tool" freeCheck proCheck />
              <ComparisonRow feature="Advanced Metrics (Sharpe, CAGR…)" freeCross proCheck isLast />
            </div>

            {/* CTA */}
            <div className="mt-6 flex justify-center">
              <Button 
                size="lg"
                onClick={handleUpgrade}
                disabled={upgrading}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Pro — ₹499/month
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold font-heading">Frequently Asked Questions</h2>
          </div>
          
          <Card className="border-border">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-border">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Can I cancel my Pro subscription anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, you can cancel your Pro subscription at any time. Your Pro features will remain active until the end of your current billing period. After that, your account will automatically switch to the Free plan.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="border-border">
                  <AccordionTrigger className="text-left hover:no-underline">
                    What payment methods do you accept?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We accept all major payment methods through Razorpay including Credit/Debit cards (Visa, Mastercard, Rupay), UPI, Net Banking, and popular wallets like Paytm, PhonePe, and Google Pay.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3" className="border-border">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Is there a refund policy?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    All payments are final. No refunds are applicable once a subscription is activated. Please review the features carefully before upgrading. If you have any concerns, contact our support team before purchasing.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4" className="border-border">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Will I lose my data if I downgrade to Free?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No, your backtest history and saved strategies will be preserved. However, you'll lose access to Pro features like unlimited backtests and AI strategies. You can upgrade again anytime to regain access.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5" className="border-border">
                  <AccordionTrigger className="text-left hover:no-underline">
                    What happens when my free limits are reached?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    When you reach your monthly backtest limit (30 per month) or strategy limit (2 strategies), you'll see a prompt to upgrade to Pro. Your backtest count resets at the start of each new month.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6" className="border-border">
                  <AccordionTrigger className="text-left hover:no-underline">
                    Do you provide investment advice?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    No, Trade Strategy Backtester is an educational tool only. We are not SEBI registered and do not provide any investment advice. All backtests and AI strategies are for educational purposes to help you understand how strategies might have performed historically. Please see our <a href="/disclaimer" className="text-accent hover:underline">disclaimer</a> for more information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7" className="border-border">
                  <AccordionTrigger className="text-left hover:no-underline">
                    How accurate is the historical data?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We use real historical OHLCV data from Yahoo Finance for NSE stocks. Free users get NIFTY50 daily data. Pro users can additionally upload their own CSV data (up to 50MB) from any exchange or vendor. Note that past performance does not guarantee future results.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Upgrade;
