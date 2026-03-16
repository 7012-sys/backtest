import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Finance Learner, Mumbai",
    content:
      "TradeTest helped me understand how moving average crossover strategies behave on historical data. The simulation results taught me so much about risk management concepts.",
    rating: 5,
    avatar: "RS",
  },
  {
    name: "Meera Joshi",
    role: "Research Student, Pune",
    content:
      "The analytics depth is impressive — Sharpe, Sortino, Calmar, drawdown analysis. I use it to study strategy performance metrics for my academic research papers.",
    rating: 5,
    avatar: "MJ",
  },
  {
    name: "Arjun Nair",
    role: "Finance Student, Delhi",
    content:
      "As a student learning technical analysis, TradeTest is invaluable. The Learning Mode explains why each simulated trade triggered. It's like having a mentor built into the platform.",
    rating: 5,
    avatar: "AN",
  },
  {
    name: "Vikram Mehta",
    role: "Quantitative Researcher, Bangalore",
    content:
      "Finally, an educational platform that covers Indian market data. Walk-forward validation and strategy versioning help me study overfitting concepts thoroughly.",
    rating: 5,
    avatar: "VM",
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-6">
            <Star className="h-4 w-4 text-success fill-success" />
            <span className="text-sm font-medium text-foreground">Trusted by Learners</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
            What Our Learners
            <br />
            <span className="text-gradient-accent">Are Saying</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of students and researchers studying strategy analysis with TradeTest
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card-hover"
            >
              <Quote className="h-8 w-8 text-accent/30 mb-4" />
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed mb-6">"{t.content}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-blue flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {["RS", "MJ", "AN", "VM"].map((initials, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-sm">10,000+ active learners</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-accent fill-accent" />
              ))}
            </div>
            <span className="text-sm">4.9/5 average rating</span>
          </div>
        </div>
      </div>
    </section>
  );
};
