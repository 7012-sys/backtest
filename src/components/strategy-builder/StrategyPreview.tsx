import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Zap } from "lucide-react";
import { Rule } from "./RuleBuilder";

interface StrategyPreviewProps {
  name: string;
  description: string;
  entryRules: Rule[];
  exitRules: Rule[];
}

const indicatorLabels: Record<string, string> = {
  price: "Price",
  sma_9: "SMA(9)",
  sma_20: "SMA(20)",
  sma_50: "SMA(50)",
  ema_9: "EMA(9)",
  ema_20: "EMA(20)",
  rsi_14: "RSI(14)",
  macd: "MACD",
  macd_signal: "MACD Signal",
  volume: "Volume",
  atr_14: "ATR(14)",
  bollinger_upper: "BB Upper",
  bollinger_lower: "BB Lower",
  high: "High",
  low: "Low",
  open: "Open",
  close: "Close",
};

const conditionLabels: Record<string, string> = {
  crosses_above: "crosses above",
  crosses_below: "crosses below",
  greater_than: ">",
  less_than: "<",
  equals: "=",
  increases_by: "↑ by",
  decreases_by: "↓ by",
};

const formatRule = (rule: Rule): string => {
  const indicator = indicatorLabels[rule.indicator] || rule.indicator;
  const condition = conditionLabels[rule.condition] || rule.condition;
  const value = indicatorLabels[rule.value] || rule.value || "?";
  
  return `${indicator} ${condition} ${value}`;
};

export const StrategyPreview = ({ name, description, entryRules, exitRules }: StrategyPreviewProps) => {
  const hasRules = entryRules.length > 0 || exitRules.length > 0;

  return (
    <Card className="border-border shadow-card sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <CardTitle className="text-base">Strategy Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy name */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Name</p>
          <p className="font-medium text-foreground">
            {name || <span className="text-muted-foreground italic">Untitled Strategy</span>}
          </p>
        </div>

        {/* Description */}
        {description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground">{description}</p>
          </div>
        )}

        {!hasRules ? (
          <div className="py-6 text-center border-2 border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Add entry and exit rules to see your strategy preview
            </p>
          </div>
        ) : (
          <>
            {/* Entry rules */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="h-4 w-4 text-success" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entry Conditions</p>
              </div>
              {entryRules.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No entry rules defined</p>
              ) : (
                <div className="space-y-1.5">
                  {entryRules.map((rule, i) => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm">
                      {i > 0 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          {rule.logic}
                        </Badge>
                      )}
                      <span className="text-foreground bg-success/10 px-2 py-1 rounded text-xs">
                        {formatRule(rule)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exit rules */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exit Conditions</p>
              </div>
              {exitRules.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No exit rules defined</p>
              ) : (
                <div className="space-y-1.5">
                  {exitRules.map((rule, i) => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm">
                      {i > 0 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                          {rule.logic}
                        </Badge>
                      )}
                      <span className="text-foreground bg-destructive/10 px-2 py-1 rounded text-xs">
                        {formatRule(rule)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Rules count */}
        <div className="pt-3 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Entry rules: {entryRules.length}</span>
            <span>Exit rules: {exitRules.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
