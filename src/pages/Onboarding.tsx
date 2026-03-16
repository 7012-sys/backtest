import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Sparkles, 
  BarChart3, 
  TrendingUp, 
  ArrowRight, 
  Check,
  Activity,
  ChevronRight
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";

const STEPS = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Quick Setup" },
  { id: 3, title: "Features" },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Backtest Your Strategies",
    description: "Test your trading ideas against historical data with realistic simulation including slippage and brokerage costs.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Activity,
    title: "Trade History & Analytics",
    description: "Track every trade, analyze performance metrics, and understand your strategy's strengths and weaknesses.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "Strategy Health Score",
    description: "Get insights into your strategy's performance over time and receive alerts when it needs attention.",
    color: "text-success",
    bg: "bg-success/10",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Quick setup state
  const [tradingPreference, setTradingPreference] = useState<string>("intraday");
  const [defaultCapital, setDefaultCapital] = useState<string>("100000");
  const [experienceLevel, setExperienceLevel] = useState<string>("beginner");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
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

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if onboarding is already completed
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate("/dashboard");
      }
    };

    if (user) {
      checkOnboarding();
    }
  }, [user, navigate]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Upsert profile with onboarding data
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          trading_preference: tradingPreference as "intraday" | "swing" | "long_term",
          default_capital: parseInt(defaultCapital) || 100000,
          experience_level: experienceLevel as "beginner" | "intermediate" | "advanced",
          email: user.email,
        }, { onConflict: "user_id" });

      if (error) {
        console.error("Error saving profile:", error);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }

    setSaving(false);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep >= step.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 transition-colors ${
                      currentStep > step.id ? "bg-accent" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-accent/10 mb-6">
                    <Sparkles className="h-10 w-10 text-accent" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-3 font-heading">
                    Welcome to TradeTest!
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Let's get you set up in just a few steps. You'll be backtesting your strategies in no time.
                  </p>
                </div>

                <Card className="bg-muted/50 border-border mb-8">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">What you'll get</h3>
                        <p className="text-sm text-muted-foreground">
                          Access to powerful backtesting tools, AI strategy generation, and detailed performance analytics.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="px-6"
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="px-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Quick Setup */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">
                    Quick Setup
                  </h1>
                  <p className="text-muted-foreground">
                    Tell us a bit about your trading preferences (you can change these later)
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Trading Preference */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Trading Style</Label>
                    <RadioGroup
                      value={tradingPreference}
                      onValueChange={setTradingPreference}
                      className="grid grid-cols-3 gap-3"
                    >
                      {[
                        { value: "intraday", label: "Intraday", desc: "Same day trades" },
                        { value: "swing", label: "Swing", desc: "Days to weeks" },
                        { value: "long_term", label: "Long Term", desc: "Weeks to months" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                            tradingPreference === option.value
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <RadioGroupItem
                            value={option.value}
                            className="sr-only"
                          />
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Default Capital */}
                  <div className="space-y-3">
                    <Label htmlFor="capital" className="text-sm font-medium">
                      Default Capital (₹)
                    </Label>
                    <Input
                      id="capital"
                      type="number"
                      value={defaultCapital}
                      onChange={(e) => setDefaultCapital(e.target.value)}
                      placeholder="100000"
                      className="text-lg"
                    />
                    <p className="text-xs text-muted-foreground">
                      This will be used as the default when creating backtests
                    </p>
                  </div>

                  {/* Experience Level */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Experience Level</Label>
                    <RadioGroup
                      value={experienceLevel}
                      onValueChange={setExperienceLevel}
                      className="grid grid-cols-3 gap-3"
                    >
                      {[
                        { value: "beginner", label: "Beginner", desc: "New to trading" },
                        { value: "intermediate", label: "Intermediate", desc: "Some experience" },
                        { value: "advanced", label: "Advanced", desc: "Experienced trader" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                            experienceLevel === option.value
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <RadioGroupItem
                            value={option.value}
                            className="sr-only"
                          />
                          <div className="font-medium text-foreground">{option.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="px-6"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="px-6 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Features */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">
                    What You Can Do
                  </h1>
                  <p className="text-muted-foreground">
                    Here's a quick overview of the key features
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {FEATURES.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-border hover:border-accent/30 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                              <feature.icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">
                                {feature.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleComplete}
                    disabled={saving}
                    className="px-8 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    ) : null}
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
