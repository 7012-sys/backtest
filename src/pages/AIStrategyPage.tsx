import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Sparkles, 
  Loader2, 
  Wand2,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { LimitReachedModal } from "@/components/ui/limit-reached-modal";

interface GeneratedStrategy {
  name: string;
  description: string;
  entryRules: any[];
  exitRules: any[];
}

const examplePrompts = [
  "Buy when RSI is below 30 and price crosses above 20-day SMA. Sell when RSI goes above 70.",
  "Golden cross strategy: buy when 50-day SMA crosses above 200-day SMA, sell when it crosses below.",
  "Mean reversion using Bollinger Bands: buy when price touches lower band, sell at middle band.",
  "Momentum strategy: buy when MACD crosses above signal line with volume confirmation.",
];

const AIStrategyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState<GeneratedStrategy | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { canUseAI, aiStrategiesUsed, aiStrategyLimit, isPro, expiryDate, refresh } = useUsageLimits(user?.id);

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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe your trading strategy idea");
      return;
    }

    if (!canUseAI) {
      setShowLimitModal(true);
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-strategy", {
        body: { prompt: prompt.trim() },
      });

      if (error) throw new Error(error.message || "Failed to generate strategy");
      if (data.error) throw new Error(data.error);
      if (!data.name || !data.entryRules || !data.exitRules) {
        throw new Error("Invalid strategy response");
      }

      setGeneratedStrategy({
        name: data.name,
        description: data.description || "",
        entryRules: data.entryRules,
        exitRules: data.exitRules,
      });

      toast.success("Strategy generated! Review the rules below.");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate strategy");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !generatedStrategy) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("strategies").insert([{
        user_id: user.id,
        name: generatedStrategy.name,
        description: generatedStrategy.description,
        rules: { entry: generatedStrategy.entryRules, exit: generatedStrategy.exitRules },
        is_ai_generated: true,
      }]);

      if (error) throw error;

      await refresh(); // Update usage limits
      toast.success("Strategy saved successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to save strategy");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndBacktest = async () => {
    if (!user || !generatedStrategy) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.from("strategies").insert([{
        user_id: user.id,
        name: generatedStrategy.name,
        description: generatedStrategy.description,
        rules: { entry: generatedStrategy.entryRules, exit: generatedStrategy.exitRules },
        is_ai_generated: true,
      }]).select().single();

      if (error) throw error;

      await refresh();
      toast.success("Strategy saved!");
      navigate(`/backtest?strategy=${data.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save strategy");
    } finally {
      setSaving(false);
    }
  };

  const formatRule = (rule: any) => {
    return `${rule.indicator} ${rule.condition.replace(/_/g, ' ')} ${rule.value}`;
  };

  return (
    <AppLayout 
      loading={loading} 
      showBack 
      backTo="/dashboard"
      title="AI Strategy Generator"
      subtitle="Describe your idea in plain English"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Usage Indicator */}
        <Card className={`border ${!canUseAI ? 'border-warning/50 bg-warning/5' : isPro ? 'border-success/30 bg-success/5' : 'border-accent/30 bg-accent/5'}`}>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`h-4 w-4 ${!canUseAI ? 'text-warning' : isPro ? 'text-success' : 'text-accent'}`} />
                <span className="text-sm">
                  {isPro ? (
                    <>
                      <strong className="text-success">Pro Plan</strong> — Unlimited AI Strategies
                      {expiryDate && (
                        <span className="text-muted-foreground ml-2">
                          · Valid until {expiryDate.toLocaleDateString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      AI Strategies Used: <strong>{aiStrategiesUsed}/{aiStrategyLimit}</strong>
                    </>
                  )}
                </span>
              </div>
              {!canUseAI && !isPro && (
                <div className="flex items-center gap-2 text-warning text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Limit reached — Upgrade to Pro for unlimited
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              How AI Strategy Works
              <InfoTooltip content="Our AI understands trading concepts and converts your plain English description into specific entry and exit rules using technical indicators." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">1</span>
                <span>Describe your trading idea in simple words (e.g., "buy when price is oversold")</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">2</span>
                <span>AI converts it into specific rules with indicators like RSI, SMA, MACD</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">3</span>
                <span>Review the generated rules and save your strategy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">4</span>
                <span>Test it on historical data to see how it would have performed</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Input Section */}
        {!generatedStrategy && (
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-accent" />
                Describe Your Strategy
              </CardTitle>
              <CardDescription>
                Tell us what you want to buy and sell, and when
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Example: I want to buy when the stock is oversold (RSI below 30) and the price starts moving up. I'll sell when RSI goes above 70 or if I make 10% profit."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="resize-none"
                disabled={isGenerating || !canUseAI}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{prompt.length}/2000</p>
              
              <div>
                <p className="text-xs text-muted-foreground mb-2">Try these examples:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      disabled={isGenerating || !canUseAI}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50 text-left"
                    >
                      {example.substring(0, 50)}...
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !canUseAI}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Strategy
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated Strategy */}
        {generatedStrategy && (
          <Card className="border-success/30 bg-success/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <CardTitle className="text-base">Strategy Generated!</CardTitle>
              </div>
              <CardDescription>Review the rules and save your strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground">{generatedStrategy.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{generatedStrategy.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <h5 className="text-sm font-medium text-success mb-2 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" /> Entry Rules (Buy)
                  </h5>
                  <ul className="space-y-1">
                    {generatedStrategy.entryRules.map((rule, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {rule.logic && <span className="text-foreground font-medium">{rule.logic} </span>}
                        {formatRule(rule)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h5 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 rotate-180" /> Exit Rules (Sell)
                  </h5>
                  <ul className="space-y-1">
                    {generatedStrategy.exitRules.map((rule, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {rule.logic && <span className="text-foreground font-medium">{rule.logic} </span>}
                        {formatRule(rule)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setGeneratedStrategy(null)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Strategy"}
                </Button>
                <Button
                  onClick={handleSaveAndBacktest}
                  disabled={saving}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Save & Test
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Limit Reached Modal */}
      <LimitReachedModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        limitType="ai_strategy"
      />
    </AppLayout>
  );
};

export default AIStrategyPage;
