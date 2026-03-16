import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, Play, BarChart3, Zap } from "lucide-react";

const headlines = [
  "Learn Before You Invest",
  "AI-Powered Strategy Education",
  "Study Historical Patterns",
  "Data-Driven Learning",
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const [currentHeadline, setCurrentHeadline] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden hero-gradient">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 dark:opacity-10" />
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-foreground">
              India's #1 Strategy Education Platform
            </span>
          </div>

          {/* Rotating Headlines */}
          <div className="min-h-[4.5rem] md:min-h-[5.5rem] mb-4 flex items-center justify-center py-2">
            <h1
              key={currentHeadline}
              className="text-4xl md:text-6xl font-bold font-heading text-foreground animate-slide-up leading-tight"
            >
              {headlines[currentHeadline]}
            </h1>
          </div>

          <p
            className="text-xl md:text-2xl text-foreground/70 mb-8 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            An <span className="text-accent font-semibold">educational platform</span> to study 
            how trading strategies would have performed on historical{" "}
            <span className="text-accent font-semibold">NSE</span> data
          </p>

          {/* CTA */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="h-14 px-8 text-lg font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent-glow"
            >
              Start Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/demo")} className="h-14 px-8 text-lg font-semibold border-2 border-border text-foreground hover:bg-muted">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in"
            style={{ animationDelay: "0.6s" }}
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold font-heading text-foreground">15K+</div>
              <div className="text-sm text-foreground/60">Simulations Run</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold font-heading text-foreground">50+</div>
              <div className="text-sm text-foreground/60">Indicators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold font-heading text-foreground">NSE</div>
              <div className="text-sm text-foreground/60">Market Data</div>
            </div>
          </div>
        </div>

        {/* Mock dashboard preview - Backtest metrics only, no Strategy Performance section */}
        <div className="mt-16 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-border bg-card p-2">
            <div className="rounded-xl bg-muted/30 dark:bg-muted/20 p-6 md:p-8">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-success">+24.5%</div>
                  <div className="text-xs text-foreground/60 mt-1">Best Return</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">67.2%</div>
                  <div className="text-xs text-foreground/60 mt-1">Win Rate</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-accent">82</div>
                  <div className="text-xs text-foreground/60 mt-1">Confidence</div>
                </div>
              </div>
              <div className="h-32 md:h-40 bg-gradient-to-br from-accent/5 to-success/5 rounded-lg flex items-center justify-center border border-border gap-1 px-4">
                {[40,55,48,62,58,72,65,80,70,85,78,90].map((h, i) => (
                  <div key={i} className="flex-1 flex items-end justify-center h-full py-3">
                    <div
                      className={`w-full rounded-sm ${h >= 60 ? 'bg-accent/70' : 'bg-destructive/50'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-foreground/40 mt-2">Sign in to explore your learning dashboard</p>
            </div>
          </div>
          <p className="text-center text-[10px] text-foreground/30 mt-3">
            ⚠️ For educational purposes only. Not financial advice. Not SEBI registered. Past performance ≠ future results.
          </p>
        </div>
      </div>
    </section>
  );
};
