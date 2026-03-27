import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Save, 
  Play,
  ArrowUpCircle,
  ArrowDownCircle,
  Lightbulb,
  Sparkles,
  Zap,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { RuleBuilder, Rule } from "@/components/strategy-builder/RuleBuilder";
import { StrategyPreview } from "@/components/strategy-builder/StrategyPreview";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { toast } from "sonner";

// Example strategies users can try
const EXAMPLE_STRATEGIES = [
  {
    name: "RSI Oversold Bounce",
    description: "Buy when RSI drops below 30 (oversold), sell when RSI rises above 70 (overbought). Classic mean-reversion strategy.",
    entryRules: [
      { id: "ex1-e1", indicator: "rsi_14", condition: "less_than", value: "30" },
    ] as Rule[],
    exitRules: [
      { id: "ex1-x1", indicator: "rsi_14", condition: "greater_than", value: "70" },
    ] as Rule[],
  },
  {
    name: "SMA Golden Cross",
    description: "Buy when 50-day SMA crosses above 200-day SMA (bullish trend). Sell when it crosses below (bearish trend).",
    entryRules: [
      { id: "ex2-e1", indicator: "sma_50", condition: "crosses_above", value: "sma_200" },
    ] as Rule[],
    exitRules: [
      { id: "ex2-x1", indicator: "sma_50", condition: "crosses_below", value: "sma_200" },
    ] as Rule[],
  },
];

const StrategyBuilder = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entryRules, setEntryRules] = useState<Rule[]>([]);
  const [exitRules, setExitRules] = useState<Rule[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const { strategiesCount, canCreateStrategy, isPro, refresh } = useUsageLimits(user?.id);

  const loadExample = (example: typeof EXAMPLE_STRATEGIES[0]) => {
    setName(example.name);
    setDescription(example.description);
    setEntryRules(example.entryRules.map(r => ({ ...r, id: Math.random().toString(36).substring(2, 9) })));
    setExitRules(example.exitRules.map(r => ({ ...r, id: Math.random().toString(36).substring(2, 9) })));
    toast.success(`Loaded "${example.name}" example`);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Please enter a strategy name"); return; }
    if (entryRules.length === 0) { toast.error("Please add at least one entry rule"); return; }
    if (exitRules.length === 0) { toast.error("Please add at least one exit rule"); return; }
    if (!canCreateStrategy) {
      toast.error("Strategy limit reached (2 for Free plan). Upgrade to Pro for unlimited strategies.");
      return;
    }

    setSaving(true);
    try {
      const rulesJson = JSON.parse(JSON.stringify({ entry: entryRules, exit: exitRules }));
      const { data, error } = await supabase.from("strategies").insert([{
        user_id: user.id, name: name.trim(), description: description.trim() || null,
        rules: rulesJson, is_ai_generated: false,
      }]).select().single();
      if (error) throw error;
      await supabase.from("strategy_versions").insert({
        strategy_id: data.id, version_number: 1, rules: rulesJson, changelog: "Initial version",
      });
      toast.success("Strategy saved successfully!");
      await supabase.from("profiles").update({ strategies_count: strategiesCount + 1 }).eq("user_id", user.id);
      refresh();
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to save strategy");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndBacktest = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Please enter a strategy name"); return; }
    if (entryRules.length === 0 || exitRules.length === 0) { toast.error("Please add entry and exit rules first"); return; }
    if (!canCreateStrategy) {
      toast.error("Strategy limit reached (2 for Free plan). Upgrade to Pro for unlimited strategies.");
      return;
    }

    setSaving(true);
    try {
      const rulesJson = JSON.parse(JSON.stringify({ entry: entryRules, exit: exitRules }));
      const { data, error } = await supabase.from("strategies").insert([{
        user_id: user.id, name: name.trim(), description: description.trim() || null,
        rules: rulesJson, is_ai_generated: false,
      }]).select().single();
      if (error) throw error;
      await supabase.from("strategy_versions").insert({
        strategy_id: data.id, version_number: 1, rules: rulesJson, changelog: "Initial version",
      });
      toast.success("Strategy saved!");
      await supabase.from("profiles").update({ strategies_count: strategiesCount + 1 }).eq("user_id", user.id);
      refresh();
      navigate(`/backtest?strategy=${data.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save strategy");
    } finally {
      setSaving(false);
    }
  };

  const headerRightContent = (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={saving}
        className="flex-1 px-3 text-xs sm:flex-none sm:text-sm"
      >
        <Save className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" /> Save
      </Button>
      <Button
        size="sm"
        onClick={handleSaveAndBacktest}
        disabled={saving}
        className="flex-1 bg-accent px-3 text-xs text-accent-foreground hover:bg-accent/90 sm:flex-none sm:text-sm"
      >
        <Play className="mr-1 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
        <span className="sm:hidden">Test</span>
        <span className="hidden sm:inline">Save & Test</span>
      </Button>
    </div>
  );

  return (
    <AppLayout 
      loading={loading} showBack backTo="/dashboard"
      title="Create Strategy" subtitle="Build trading rules step by step"
      rightContent={headerRightContent}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Builder Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Beginner Tips — shown first */}
          <Card className="border-border bg-muted/30">
            <CardContent className="py-4">
              <h4 className="font-medium text-foreground text-sm mb-2">💡 Beginner Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• <strong>Start simple:</strong> One entry rule + one exit rule is enough to start</li>
                <li>• <strong>Always add a stop-loss:</strong> "Price decreases by 5%" as exit rule protects you</li>
                <li>• <strong>RSI below 30:</strong> Means the stock is "oversold" (might go up)</li>
                <li>• <strong>RSI above 70:</strong> Means the stock is "overbought" (might go down)</li>
                <li>• <strong>Moving Averages:</strong> SMA 50 crossing above SMA 200 = bullish signal</li>
              </ul>
            </CardContent>
          </Card>

          {/* What is a Strategy */}
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm mb-1">What is a Strategy?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A strategy is a set of rules that tell you when to buy (entry) and when to sell (exit). 
                    For example: "Buy when RSI is below 30" and "Sell when RSI goes above 70".
                    You create rules using indicators like RSI, Moving Averages, MACD, etc.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Try Example Strategies */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Try an Example Strategy
              </CardTitle>
              <CardDescription>Don't want to build from scratch? Load a proven strategy template.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {EXAMPLE_STRATEGIES.map((ex, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors group"
                    onClick={() => loadExample(ex)}
                  >
                    <h5 className="font-medium text-sm text-foreground mb-1 group-hover:text-accent transition-colors">{ex.name}</h5>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{ex.description}</p>
                    <div className="text-xs space-y-1">
                      <p className="text-success">▲ Buy: {ex.entryRules.map(r => `${r.indicator} ${r.condition} ${r.value}`).join(', ')}</p>
                      <p className="text-destructive">▼ Sell: {ex.exitRules.map(r => `${r.indicator} ${r.condition} ${r.value}`).join(', ')}</p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
                      Use This Strategy
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Strategy Link */}
          <Card 
            className="border-border shadow-card cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => navigate("/ai-strategy")}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">Prefer AI?</h4>
                    <p className="text-xs text-muted-foreground">Describe your idea in plain English instead</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Try AI Strategy</Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                Strategy Details
                <InfoTooltip content="Give your strategy a name you'll remember. The description helps you recall what this strategy does later." />
              </CardTitle>
              <CardDescription>Name and describe your strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Strategy Name *</Label>
                <Input id="name" placeholder="e.g., RSI Oversold Strategy" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                <p className="text-xs text-muted-foreground text-right">{name.length}/100</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea id="description" placeholder="What does this strategy do? When does it work best?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={500} />
                <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
              </div>
            </CardContent>
          </Card>

          {/* Entry Rules */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-success" />
                Entry Rules (When to Buy)
                <InfoTooltip content="Entry rules define when to buy a stock. For example: 'When RSI is below 30' means buy when the stock is oversold." />
              </CardTitle>
              <CardDescription>Define the conditions that trigger a buy signal</CardDescription>
            </CardHeader>
            <CardContent>
              <RuleBuilder rules={entryRules} onChange={setEntryRules} type="entry" />
            </CardContent>
          </Card>

          {/* Exit Rules */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                Exit Rules (When to Sell)
                <InfoTooltip content="Exit rules define when to sell. This could be taking profit or cutting loss. Always include a stop-loss!" />
              </CardTitle>
              <CardDescription>Define when to sell and take profit or cut losses</CardDescription>
            </CardHeader>
            <CardContent>
              <RuleBuilder rules={exitRules} onChange={setExitRules} type="exit" />
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <StrategyPreview name={name} description={description} entryRules={entryRules} exitRules={exitRules} />
        </div>
      </div>
    </AppLayout>
  );
};

export default StrategyBuilder;