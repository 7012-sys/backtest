import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  FlaskConical,
  Globe,
  Heart,
  Layers,
  LineChart,
  Plus,
  Settings2,
  Share2,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const Demo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo />
          </div>
          <Button onClick={() => navigate("/auth")} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Start Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl space-y-16">
        {/* SECTION 1: What is TradeTest? */}
        <section className="text-center space-y-6">
          <Badge variant="outline" className="text-sm px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 mr-1.5" /> Product Demo
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground">
            What is TradeTest?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            TradeTest is India's first backtesting platform that lets you test your trading strategies on
            historical NSE stock data — <span className="text-accent font-semibold">before risking real money</span>.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
            <div className="text-center p-4 rounded-xl border border-border bg-card">
              <Layers className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Create Strategies</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-border bg-card">
              <FlaskConical className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Run Backtests</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-border bg-card">
              <BarChart3 className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Analyze Results</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: How to Create Manual Strategy */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-foreground">Create a Manual Strategy</h2>
              <p className="text-sm text-muted-foreground">Step-by-step rule builder</p>
            </div>
          </div>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <p className="text-muted-foreground">
                Build strategies by defining entry and exit rules using technical indicators. Here's an example of a classic
                <span className="text-foreground font-semibold"> SMA 50/200 Crossover</span> strategy:
              </p>

              {/* Mock Strategy Builder */}
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">📥 Entry Rules</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-primary/10 text-primary border-primary/20">SMA (50)</Badge>
                    <span className="text-sm text-foreground font-medium">crosses above</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">SMA (200)</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">→ Buy when the 50-period moving average crosses above the 200-period moving average</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">📤 Exit Rules</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">SMA (50)</Badge>
                    <span className="text-sm text-foreground font-medium">crosses below</span>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">SMA (200)</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">→ Sell when the 50-period moving average crosses below the 200-period moving average</p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/5 p-3 rounded-lg border border-accent/10">
                <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>Available indicators: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, VWAP, and more.</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 3: How to Create AI Strategy */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-foreground">Create an AI Strategy</h2>
              <p className="text-sm text-muted-foreground">Describe your idea in plain English</p>
            </div>
          </div>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <p className="text-muted-foreground">
                Don't know technical indicators? Just describe what you want in plain English and our AI will convert it into a rule-based strategy.
              </p>

              {/* Mock AI Input */}
              <div className="p-4 rounded-lg border-2 border-dashed border-accent/30 bg-accent/5">
                <p className="text-xs uppercase tracking-wider text-accent mb-2 font-medium">✏️ Your Input</p>
                <p className="text-foreground font-medium italic">
                  "Buy when RSI is below 30 and price is above 200 SMA. Sell when RSI goes above 70."
                </p>
              </div>

              {/* Mock AI Output */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-accent" />
                  <span className="font-medium text-foreground">AI Generated Rules:</span>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Entry</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-primary/10 text-primary border-primary/20">RSI (14) &lt; 30</Badge>
                      <span className="text-xs text-muted-foreground">AND</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">Price &gt; SMA (200)</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Exit</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-destructive/10 text-destructive border-destructive/20">RSI (14) &gt; 70</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-accent/5 p-3 rounded-lg border border-accent/10">
                <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>AI Strategy is a <strong>Pro</strong> feature. Free users can create up to 2 manual strategies.</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 4: How to Run Backtest */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-foreground">Run a Backtest</h2>
              <p className="text-sm text-muted-foreground">Test your strategy on historical data</p>
            </div>
          </div>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <p className="text-muted-foreground">
                Configure your backtest with just a few settings and let TradeTest simulate every trade.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <p className="font-medium text-foreground text-sm">Step 1: Select Data</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-success" />
                      <span>NIFTY50 daily data (Free) or upload CSV (Pro)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Upload className="h-3.5 w-3.5 text-accent" />
                      <span>Or upload your own CSV data (Pro)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <p className="font-medium text-foreground text-sm">Step 2: Configure Settings</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Initial Capital</span>
                      <span className="text-foreground font-medium">₹1,00,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission</span>
                      <span className="text-foreground font-medium">0.03%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slippage</span>
                      <span className="text-foreground font-medium">0.05%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="font-medium text-foreground text-sm mb-2">Step 3: Select Strategy & Run</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-2.5 rounded-md border border-border bg-muted/30 text-sm text-foreground">
                    SMA 50/200 Crossover
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                    <FlaskConical className="h-4 w-4 mr-1.5" /> Run Backtest
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 5: Backtest Results */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-foreground">Backtest Results</h2>
              <p className="text-sm text-muted-foreground">Detailed performance analysis</p>
            </div>
          </div>

          <Card className="border-border">
            <CardContent className="p-6 space-y-5">
              <p className="text-muted-foreground">
                After running a backtest, you get a comprehensive breakdown of how your strategy would have performed.
              </p>

              {/* Key Metrics Mock */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Net P&L", value: "+₹24,500", color: "text-success" },
                  { label: "Win Rate", value: "67.2%", color: "text-foreground" },
                  { label: "Profit Factor", value: "2.14", color: "text-accent" },
                  { label: "Max Drawdown", value: "-8.3%", color: "text-destructive" },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded-lg border border-border bg-card text-center">
                    <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                    <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Equity Curve Mock */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-accent" /> Equity Curve
                </p>
                <div className="h-40 rounded-lg border border-border bg-muted/20 flex items-end px-4 pb-4 gap-1">
                  {[40, 42, 45, 43, 48, 52, 50, 55, 58, 54, 60, 62, 58, 65, 68, 64, 70, 72, 75, 78, 74, 80, 82, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-accent/60"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">Simulated equity growth over backtest period</p>
              </div>

              {/* Trade List Mock */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">📋 Sample Trade List</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">#</th>
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Entry</th>
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Exit</th>
                        <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">Side</th>
                        <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { entry: "2024-03-15", exit: "2024-04-02", side: "LONG", pnl: "+₹3,200" },
                        { entry: "2024-05-10", exit: "2024-05-28", side: "LONG", pnl: "-₹1,100" },
                        { entry: "2024-06-20", exit: "2024-07-15", side: "LONG", pnl: "+₹5,800" },
                      ].map((t, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 px-3 text-foreground">{t.entry}</td>
                          <td className="py-2 px-3 text-foreground">{t.exit}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-xs">{t.side}</Badge>
                          </td>
                          <td className={`py-2 px-3 text-right font-medium ${t.pnl.startsWith("+") ? "text-success" : "text-destructive"}`}>
                            {t.pnl}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confidence Score Mock */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm font-medium text-foreground mb-3">🎯 Confidence Score</p>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full border-4 border-accent flex items-center justify-center">
                      <span className="text-2xl font-bold text-accent">82</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Based on win rate, drawdown, consistency, and profit factor.</p>
                      <p className="text-accent font-medium">Strong Strategy</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm font-medium text-foreground mb-3">📊 Walk-Forward Analysis</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Tests your strategy on multiple time windows to check for overfitting.</p>
                    <div className="flex gap-1.5">
                      {["Pass", "Pass", "Fail", "Pass", "Pass"].map((r, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={`text-xs ${r === "Pass" ? "border-success/30 text-success" : "border-destructive/30 text-destructive"}`}
                        >
                          W{i + 1}: {r}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-accent font-medium mt-1">Pro Feature</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-3xl font-bold font-heading text-foreground">Ready to Test Your Strategy?</h2>
          <p className="text-muted-foreground">Create your free account and run your first backtest in minutes.</p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="h-14 px-10 text-lg font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Start Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TradeTest. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Demo;
