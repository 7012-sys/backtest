import {
  BarChart3,
  Sparkles,
  Shield,
  Clock,
  TrendingUp,
  FileText,
  Zap,
  LineChart,
  GitBranch,
  FlaskConical,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Deterministic Backtesting",
    description:
      "Candle-by-candle simulation with commission, slippage, and position sizing. No repainting, no future data leakage.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Sparkles,
    title: "AI Strategy Builder",
    description:
      "Describe your trading idea in plain English and let AI create a complete, testable strategy. Pro feature.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Shield,
    title: "NSE Stock Coverage",
    description:
      "Free users get NIFTY50 daily data. Pro users can upload any CSV dataset from any exchange or vendor.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Clock,
    title: "Auto-Detect Timeframes",
    description:
      "Upload CSV data and the system auto-detects timeframe, date range, and candle count instantly.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Confidence & Health Scoring",
    description:
      "Every backtest gets a confidence score and health panel — overfit risk, regime sensitivity, drawdown severity.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: FileText,
    title: "Clear Results & Export",
    description:
      "Summary metrics, equity curve, monthly returns, and full trade log. Export to PDF or Excel (Pro).",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: GitBranch,
    title: "Strategy Versioning",
    description:
      "Every edit creates a version snapshot. Backtests are tied to versions — history is never overwritten.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: FlaskConical,
    title: "Walk-Forward Validation",
    description:
      "Rolling train/test windows compare in-sample vs out-of-sample performance to detect overfitting. Pro feature.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: LineChart,
    title: "Strict Date Range Control",
    description:
      "Results reflect only your selected date range. No cached data, no leftover state. Every config change triggers a full re-run.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

/* Mock preview cards for the 3 product areas */
const previews = [
  {
    title: "Backtest Output",
    subtitle: "Detailed analytics after every run",
    metrics: [
      { label: "Win Rate", value: "67.5%" },
      { label: "Net P&L", value: "+₹2.4L" },
      { label: "Max DD", value: "-8.2%" },
    ],
  },
  {
    title: "Analytics Dashboard",
    subtitle: "Your strategy performance at a glance",
    metrics: [
      { label: "Strategies", value: "2/∞" },
      { label: "Best Return", value: "+32%" },
      { label: "Confidence", value: "82" },
    ],
  },
  {
    title: "Strategy Builder",
    subtitle: "Rule-based with 10+ indicators",
    metrics: [
      { label: "Indicators", value: "10+" },
      { label: "Versions", value: "V3" },
      { label: "Rules", value: "4" },
    ],
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
            Everything You Need to Learn
            <br />
            <span className="text-gradient-accent">Strategy Analysis</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            An educational toolkit for studying how technical strategies behave on historical data.
            No tips, no signals — just learning.
          </p>
        </div>

        {/* Product Preview Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {previews.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-accent/30 hover:shadow-card-hover transition-all duration-300"
            >
              <h3 className="font-semibold font-heading text-foreground mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{p.subtitle}</p>
              <div className="grid grid-cols-3 gap-2">
                {p.metrics.map((m) => (
                  <div key={m.label} className="rounded-lg bg-muted p-3 text-center">
                    <div className="text-lg font-bold text-accent">{m.value}</div>
                    <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold font-heading text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border">
            <LineChart className="h-8 w-8 text-primary" />
            <div className="text-left">
              <div className="font-semibold font-heading text-foreground">
                Ready to learn strategy analysis?
              </div>
              <div className="text-sm text-muted-foreground">
                Start with 30 free simulations per month — for educational use only
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
