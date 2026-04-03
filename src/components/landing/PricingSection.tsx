import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, Crown } from "lucide-react";

const freeFeatures = [
  { text: "2 Manual Strategies", included: true },
  { text: "NIFTY50 Market Data", included: true },
  { text: "30 Backtests per Month", included: true },
  { text: "All 15+ Technical Indicators", included: true },
  { text: "Custom Indicator Parameters", included: true },
  { text: "Summary Metrics & Equity Curve", included: true },
  { text: "Community Strategy Hub", included: true },
  { text: "Like & Upvote Strategies", included: true },
  { text: "No-Repainting Deterministic Engine", included: true },
];

const lockedFeatures = [
  "AI Strategy Generation",
  "Custom CSV Upload",
  "25+ Indian Stock Symbols",
  "Monthly Returns Chart",
  "Trade-by-Trade Log",
  "Walk-Forward Validation",
  "Export PDF / Excel",
];

const proFeatures = [
  "Unlimited Strategies",
  "NIFTY50 + 20+ Indian Stocks",
  "Custom CSV Upload",
  "Unlimited Backtests",
  "All Timeframes (1m to 1M)",
  "Custom Indicator Parameters",
  "AI Strategy Generation (30/day)",
  "Community Strategy Sharing",
  "Like & Upvote Strategies",
  "Full Analytics Dashboard",
  "Monthly Returns Chart",
  "Complete Trade Log & Learning Mode",
  "Walk-Forward Validation",
  "PDF + Excel Export",
  "Position Sizing & Short Selling",
  "Priority Support",
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
            <Crown className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Simple Pricing</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
            Start Free, Upgrade When
            <br />
            <span className="text-gradient-accent">You're Ready</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. No credit card required. Start backtesting today.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* FREE */}
          <div className="p-8 rounded-2xl bg-card border border-border hover:border-accent/30 hover:shadow-card-hover transition-all duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-semibold font-heading text-foreground mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-heading text-foreground">₹0</span>
                <span className="text-muted-foreground">forever</span>
              </div>
              <p className="text-sm mt-2 text-muted-foreground">Perfect for getting started</p>
            </div>

            <ul className="space-y-3 mb-6">
              {freeFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                  <span className="text-sm text-foreground">{f.text}</span>
                </li>
              ))}
            </ul>

            {/* Pro features preview */}
            <div className="rounded-xl border border-border bg-muted/50 p-4 mb-8">
              <p className="text-xs font-medium text-muted-foreground mb-3">Not included in Free:</p>
              <ul className="space-y-2">
                {lockedFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <XCircle className="h-4 w-4 text-muted-foreground/50" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => navigate("/auth")}
              variant="outline"
              className="w-full h-12 font-semibold"
            >
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* PRO */}
          <div className="relative p-8 rounded-2xl bg-primary text-primary-foreground shadow-elevated scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-accent-glow">
                50% OFF — Most Popular
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold font-heading text-primary-foreground mb-2">Pro</h3>
              <div className="text-lg line-through text-primary-foreground/50">₹999</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-heading text-primary-foreground">₹499</span>
                <span className="text-primary-foreground/70">/month</span>
              </div>
              <p className="text-sm mt-2 text-primary-foreground/80">
                For serious learners & researchers
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary-foreground" />
                  <span className="text-sm text-primary-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => navigate("/auth")}
              className="w-full h-12 font-semibold bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Upgrade to Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* No refund note */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            🔒 <span className="font-medium">All payments are final.</span> No refunds applicable.
          </p>
          <div className="max-w-2xl mx-auto mt-4 p-4 rounded-lg bg-muted border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              ⚠️ <strong>Educational Platform Disclaimer:</strong> TradeTest is strictly an educational and research tool for studying historical market data. 
              We do NOT provide trading tips, investment advice, buy/sell signals, or portfolio recommendations. 
              We are NOT registered with SEBI as an investment advisor, research analyst, or broker. 
              Past performance shown in simulations does not guarantee future results. All content is for learning purposes only.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
