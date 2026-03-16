import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, GripVertical, Lock, Crown } from "lucide-react";
import { useUsageLimits, FREE_INDICATORS, PRO_INDICATORS } from "@/hooks/useUsageLimits";
import { supabase } from "@/integrations/supabase/client";
import { LimitReachedModal } from "@/components/ui/limit-reached-modal";

export interface Rule {
  id: string;
  indicator: string;
  condition: string;
  value: string;
  logic?: "AND" | "OR";
}

interface RuleBuilderProps {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
  type: "entry" | "exit";
}

// Indicator definitions with categories
const allIndicators = [
  // Price
  { value: "price", label: "Price", isPro: false, category: "price" },
  { value: "open", label: "Open", isPro: false, category: "price" },
  { value: "high", label: "High", isPro: false, category: "price" },
  { value: "low", label: "Low", isPro: false, category: "price" },
  { value: "close", label: "Close", isPro: false, category: "price" },

  // Moving Averages — SMA
  { value: "sma_9", label: "SMA (9)", isPro: false, category: "trend" },
  { value: "sma_20", label: "SMA (20)", isPro: false, category: "trend" },
  { value: "sma_50", label: "SMA (50)", isPro: false, category: "trend" },
  { value: "sma_100", label: "SMA (100)", isPro: false, category: "trend" },
  { value: "sma_200", label: "SMA (200)", isPro: false, category: "trend" },

  // Moving Averages — EMA
  { value: "ema_8", label: "EMA (8)", isPro: false, category: "trend" },
  { value: "ema_9", label: "EMA (9)", isPro: false, category: "trend" },
  { value: "ema_13", label: "EMA (13)", isPro: false, category: "trend" },
  { value: "ema_20", label: "EMA (20)", isPro: false, category: "trend" },
  { value: "ema_21", label: "EMA (21)", isPro: false, category: "trend" },
  { value: "ema_34", label: "EMA (34)", isPro: false, category: "trend" },
  { value: "ema_50", label: "EMA (50)", isPro: false, category: "trend" },

  // RSI
  { value: "rsi_7", label: "RSI (7)", isPro: false, category: "momentum" },
  { value: "rsi_14", label: "RSI (14)", isPro: false, category: "momentum" },
  { value: "rsi_21", label: "RSI (21)", isPro: false, category: "momentum" },

  // Volume
  { value: "volume", label: "Volume", isPro: false, category: "volume" },
  { value: "volume_sma_20", label: "Volume SMA (20)", isPro: false, category: "volume" },

  // MACD
  { value: "macd", label: "MACD", isPro: false, category: "momentum" },
  { value: "macd_signal", label: "MACD Signal", isPro: false, category: "momentum" },
  { value: "macd_histogram", label: "MACD Histogram", isPro: false, category: "momentum" },

  // Bollinger Bands
  { value: "bollinger_upper", label: "Bollinger Upper", isPro: false, category: "volatility" },
  { value: "bollinger_middle", label: "Bollinger Middle", isPro: false, category: "volatility" },
  { value: "bollinger_lower", label: "Bollinger Lower", isPro: false, category: "volatility" },
  { value: "bb_width", label: "BB Width (Squeeze)", isPro: false, category: "volatility" },

  // Stochastic
  { value: "stochastic_k", label: "Stochastic %K", isPro: false, category: "momentum" },
  { value: "stochastic_d", label: "Stochastic %D", isPro: false, category: "momentum" },

  // Other Momentum
  { value: "cci", label: "CCI", isPro: false, category: "momentum" },
  { value: "mfi", label: "MFI", isPro: false, category: "momentum" },
  { value: "williams_r", label: "Williams %R", isPro: false, category: "momentum" },
  { value: "roc", label: "Rate of Change", isPro: false, category: "momentum" },

  // Trend
  { value: "adx", label: "ADX", isPro: false, category: "trend" },
  { value: "parabolic_sar", label: "Parabolic SAR", isPro: false, category: "trend" },

  // Volatility
  { value: "atr_14", label: "ATR (14)", isPro: false, category: "volatility" },

  // Volume-based
  { value: "obv", label: "OBV", isPro: false, category: "volume" },
  { value: "vwap", label: "VWAP", isPro: false, category: "volume" },

  // Breakout Indicators
  { value: "high_20", label: "20-Day High", isPro: false, category: "breakout" },
  { value: "low_20", label: "20-Day Low", isPro: false, category: "breakout" },
  { value: "high_52w", label: "52-Week High", isPro: false, category: "breakout" },
  { value: "low_52w", label: "52-Week Low", isPro: false, category: "breakout" },
  { value: "prev_day_high", label: "Prev Day High (ORB)", isPro: false, category: "breakout" },
  { value: "prev_day_low", label: "Prev Day Low (ORB)", isPro: false, category: "breakout" },

  // Candlestick Patterns (returns 1 when detected, 0 otherwise)
  { value: "bullish_engulfing", label: "Bullish Engulfing", isPro: false, category: "candlestick" },
  { value: "bearish_engulfing", label: "Bearish Engulfing", isPro: false, category: "candlestick" },
  { value: "hammer", label: "Hammer", isPro: false, category: "candlestick" },
  { value: "shooting_star", label: "Shooting Star", isPro: false, category: "candlestick" },
  { value: "morning_star", label: "Morning Star", isPro: false, category: "candlestick" },
  { value: "doji", label: "Doji", isPro: false, category: "candlestick" },
  { value: "inside_bar", label: "Inside Bar", isPro: false, category: "candlestick" },
];

// Coming Soon indicators shown in UI but disabled
const comingSoonIndicators = [
  { value: "fibonacci_38", label: "Fibonacci 38.2%", category: "coming_soon" },
  { value: "fibonacci_50", label: "Fibonacci 50%", category: "coming_soon" },
  { value: "fibonacci_62", label: "Fibonacci 61.8%", category: "coming_soon" },
  { value: "rsi_divergence", label: "RSI Divergence", category: "coming_soon" },
  { value: "support_level", label: "Support Level", category: "coming_soon" },
  { value: "resistance_level", label: "Resistance Level", category: "coming_soon" },
  { value: "relative_strength", label: "Relative Strength (vs Index)", category: "coming_soon" },
  { value: "gap_up", label: "Gap Up", category: "coming_soon" },
  { value: "gap_down", label: "Gap Down", category: "coming_soon" },
  { value: "iron_condor", label: "Iron Condor (Options)", category: "coming_soon" },
  { value: "straddle", label: "Straddle (Options)", category: "coming_soon" },
];

const conditions = [
  { value: "crosses_above", label: "Crosses Above" },
  { value: "crosses_below", label: "Crosses Below" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "equals", label: "Equals" },
  { value: "increases_by", label: "Increases By %" },
  { value: "decreases_by", label: "Decreases By %" },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export const RuleBuilder = ({ rules, onChange, type }: RuleBuilderProps) => {
  const [userId, setUserId] = useState<string | undefined>();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isPro, isIndicatorAllowed } = useUsageLimits(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  // Count indicators used
  const usedIndicators = new Set(rules.map(r => r.indicator));
  const freeIndicatorsUsed = [...usedIndicators].filter(ind => 
    allIndicators.find(i => i.value === ind && !i.isPro)
  ).length;

  const addRule = () => {
    const newRule: Rule = {
      id: generateId(),
      indicator: "price",
      condition: "crosses_above",
      value: "",
      logic: rules.length > 0 ? "AND" : undefined,
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (id: string, field: keyof Rule, value: string) => {
    // Check if trying to select a PRO indicator when not Pro user
    if (field === "indicator") {
      const indicator = allIndicators.find(i => i.value === value);
      if (indicator?.isPro && !isPro) {
        setShowUpgradeModal(true);
        return;
      }
    }
    
    onChange(rules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  const removeRule = (id: string) => {
    const newRules = rules.filter(rule => rule.id !== id);
    // Remove logic from first rule
    if (newRules.length > 0 && newRules[0].logic) {
      newRules[0] = { ...newRules[0], logic: undefined };
    }
    onChange(newRules);
  };

  // Separate FREE and PRO indicators for display
  const freeIndicators = allIndicators.filter(i => !i.isPro);
  const proIndicators = allIndicators.filter(i => i.isPro);

  return (
    <div className="space-y-3">
      {/* Indicator Usage Counter for FREE users */}
      {!isPro && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border">
          <span className="text-sm text-muted-foreground">Indicators used:</span>
          <Badge variant="outline" className="text-xs">
            {freeIndicatorsUsed} / {freeIndicators.length} free indicators
          </Badge>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            No {type} rules defined yet
          </p>
          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-2" />
            Add {type === "entry" ? "Entry" : "Exit"} Rule
          </Button>
        </div>
      ) : (
        <>
          {rules.map((rule, index) => (
            <Card key={rule.id} className="p-4 bg-muted/30 border-border">
              <div className="flex items-start gap-3">
                <div className="pt-2 text-muted-foreground cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </div>
                
                <div className="flex-1 space-y-3">
                  {/* Logic connector */}
                  {index > 0 && (
                    <Select
                      value={rule.logic}
                      onValueChange={(v) => updateRule(rule.id, "logic", v)}
                    >
                      <SelectTrigger className="w-20 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Rule definition */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Indicator Selector with PRO badges */}
                    <Select
                      value={rule.indicator}
                      onValueChange={(v) => updateRule(rule.id, "indicator", v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Indicator" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {/* Group by category */}
                        {['price', 'trend', 'momentum', 'volatility', 'volume', 'breakout', 'candlestick'].map(cat => {
                          const items = allIndicators.filter(i => i.category === cat);
                          if (items.length === 0) return null;
                          const catLabel = cat === 'price' ? '📊 Price' : cat === 'trend' ? '📈 Trend' : cat === 'momentum' ? '⚡ Momentum' : cat === 'volatility' ? '🌊 Volatility' : cat === 'volume' ? '📦 Volume' : cat === 'breakout' ? '🚀 Breakout' : '🕯️ Candlestick';
                          return (
                            <div key={cat}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{catLabel}</div>
                              {items.map(ind => (
                                <SelectItem key={ind.value} value={ind.value}>
                                  {ind.label}
                                </SelectItem>
                              ))}
                            </div>
                          );
                        })}
                        {/* Coming Soon */}
                        <div>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🔒 Coming Soon</div>
                          {comingSoonIndicators.map(ind => (
                            <SelectItem key={ind.value} value={ind.value} disabled>
                              <span className="flex items-center gap-2 opacity-50">
                                {ind.label}
                                <Badge variant="outline" className="text-[10px] px-1 py-0">Soon</Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </div>
                      </SelectContent>
                    </Select>

                    <Select
                      value={rule.condition}
                      onValueChange={(v) => updateRule(rule.id, "condition", v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map(cond => (
                          <SelectItem key={cond.value} value={cond.value}>
                            {cond.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Value or Indicator"
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, "value", e.target.value)}
                        className="h-10 flex-1"
                        maxLength={50}
                      />
                      <Select
                        value={rule.value}
                        onValueChange={(v) => updateRule(rule.id, "value", v)}
                      >
                        <SelectTrigger className="w-10 h-10 px-0 justify-center">
                          <span className="text-xs">...</span>
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                         {allIndicators.map(ind => (
                            <SelectItem key={ind.value} value={ind.value}>
                              {ind.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          
          <Button variant="outline" size="sm" onClick={addRule} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Rule
          </Button>
        </>
      )}

      {/* Upgrade Modal */}
      <LimitReachedModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType="indicator"
        title="PRO Indicator"
        description="Advanced indicators like MACD, Bollinger Bands, Stochastic, ADX, and more are available with PRO. Upgrade to unlock all 50+ professional indicators."
      />
    </div>
  );
};
