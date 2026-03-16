import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Target } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface Trade {
  id: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  side: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
}

interface LearningModeProps {
  trades: Trade[];
  entryRules?: any[];
  exitRules?: any[];
}

function explainTrade(trade: Trade, entryRules: any[], exitRules: any[]): { entryReason: string; exitReason: string; marketContext: string } {
  const entryIndicators = entryRules.map(r => r.indicator).filter(Boolean);
  const exitIndicators = exitRules.map(r => r.indicator).filter(Boolean);

  const entryConditions = entryRules.map(r => `${r.indicator} ${r.condition} ${r.value}`).join(", ");
  const exitConditions = exitRules.map(r => `${r.indicator} ${r.condition} ${r.value}`).join(", ");

  const entryReason = entryConditions
    ? `Entry triggered because: ${entryConditions}`
    : "Entry triggered by strategy rules";

  const exitReason = trade.pnl > 0
    ? exitConditions
      ? `Profit target or exit condition met (${exitConditions}). Gain: ${trade.pnlPercent.toFixed(1)}%`
      : `Exited with ${trade.pnlPercent.toFixed(1)}% profit`
    : exitConditions
      ? `Stop loss or exit condition triggered (${exitConditions}). Loss: ${trade.pnlPercent.toFixed(1)}%`
      : `Exited with ${trade.pnlPercent.toFixed(1)}% loss`;

  const priceChange = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100);
  const marketContext = Math.abs(priceChange) < 1
    ? "Market was ranging/sideways during this trade"
    : priceChange > 3
      ? "Market was in a strong uptrend"
      : priceChange > 0
        ? "Market showed mild bullish momentum"
        : priceChange < -3
          ? "Market was in a strong downtrend"
          : "Market showed mild bearish pressure";

  return { entryReason, exitReason, marketContext };
}

export const LearningMode = ({ trades, entryRules = [], exitRules = [] }: LearningModeProps) => {
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const displayTrades = trades.slice(0, 10);

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          Learning Mode
          <InfoTooltip content="Understand why each trade was triggered and what market conditions existed. Expand any trade to see a plain-language explanation." />
          <Badge variant="secondary" className="text-xs ml-auto">First {displayTrades.length} trades</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayTrades.map((trade) => {
          const isExpanded = expandedTrade === trade.id;
          const explanation = explainTrade(trade, entryRules, exitRules);
          const isProfitable = trade.pnl > 0;

          return (
            <div key={trade.id} className="border border-border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors text-left"
                onClick={() => setExpandedTrade(isExpanded ? null : trade.id)}
              >
                <div className="flex items-center gap-2">
                  {isProfitable ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                  <span className="text-xs font-mono">{trade.id}</span>
                  <span className="text-xs text-muted-foreground">{trade.entryDate}</span>
                  <span className={`text-xs font-medium ${isProfitable ? "text-success" : "text-destructive"}`}>
                    {isProfitable ? "+" : ""}{trade.pnlPercent.toFixed(1)}%
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-border bg-muted/10">
                  <div className="pt-2">
                    <div className="flex items-start gap-2 mb-2">
                      <Target className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Why did this trade open?</p>
                        <p className="text-xs text-muted-foreground">{explanation.entryReason}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mb-2">
                      {isProfitable ? <TrendingUp className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
                      <div>
                        <p className="text-xs font-medium text-foreground">Why did it close?</p>
                        <p className="text-xs text-muted-foreground">{explanation.exitReason}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Market Context</p>
                        <p className="text-xs text-muted-foreground">{explanation.marketContext}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                    <span>Entry: ₹{trade.entryPrice.toLocaleString()}</span>
                    <span>Exit: ₹{trade.exitPrice.toLocaleString()}</span>
                    <span>Held: {trade.holdingDays}d</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
