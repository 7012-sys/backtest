import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How accurate are the backtest results?",
    answer:
      "TradeTest uses candle-by-candle deterministic execution on OHLCV data. The same input always produces the same output. We model commission, brokerage, and slippage to simulate realistic conditions. However, backtesting uses historical data and cannot account for real-time market impact, liquidity constraints, or order-book dynamics. Past performance does not guarantee future results.",
  },
  {
    question: "Where does the market data come from?",
    answer:
      "TradeTest fetches real historical market data from Yahoo Finance for NSE indices and stocks. Free users get access to NIFTY50 daily data. The data is unadjusted OHLCV. If the API is temporarily unavailable, the system falls back to simulated data and clearly notifies you. Pro users can upload their own CSV data from any exchange or data vendor for additional symbols and timeframes (up to 50MB per file).",
  },
  {
    question: "How does pricing work?",
    answer:
      "TradeTest offers a Free plan (₹0 forever) with 2 strategies and 30 backtests per month on NIFTY50 daily data. The Pro plan is ₹499/month (50% off from ₹999) and unlocks unlimited strategies, unlimited backtests, AI strategy generation, CSV upload, all timeframes, walk-forward validation, learning mode, and PDF/Excel export.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "All payments are final. We do not offer refunds once a subscription is activated. Please review the features carefully before upgrading. If you have any concerns, contact our support team before purchasing.",
  },
  {
    question: "Is TradeTest registered with SEBI?",
    answer:
      "No. TradeTest is a research and educational tool only. We are not registered with SEBI as an investment advisor, broker, or portfolio manager. We do not provide buy/sell recommendations or financial advice of any kind.",
  },
  {
    question: "Can I use TradeTest for real money trading?",
    answer:
      "TradeTest is strictly a backtesting and analysis platform. It does not connect to any broker, does not execute live trades, and does not manage any real money. Past backtest performance does not guarantee future results. Always consult a qualified financial advisor before making trading decisions.",
  },
  {
    question: "What types of strategies can I test?",
    answer:
      "You can build rule-based strategies using 15+ technical indicators including SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic, ATR, ADX, Parabolic SAR, OBV, VWAP, CCI, MFI, and Volume SMA. All indicators are available on both Free and Pro plans. Strategies support entry/exit conditions, stop losses, and multiple rule combinations. Pro users can also use AI to generate strategies from plain English descriptions.",
  },
  {
    question: "What is Walk-Forward Validation?",
    answer:
      "Walk-forward validation is a Pro feature that splits your data into rolling training and testing windows. It helps detect overfitting by comparing in-sample and out-of-sample performance across multiple cycles, giving you confidence that your strategy generalises beyond the data it was optimised on.",
  },
  {
    question: "What does initial capital affect?",
    answer:
      "Initial capital determines position sizing for your backtests. It impacts how many shares/units can be bought per trade, which directly affects your absolute P&L figures. Percentage-based metrics like Win Rate and Return % remain proportional regardless of capital, but metrics like Net P&L and Max Drawdown are capital-dependent.",
  },
  {
    question: "What analytics and metrics are available?",
    answer:
      "Free users get key metrics (Win Rate, Net P&L, Total Trades, Max Drawdown, Sharpe Ratio, Profit Factor), equity curve, and confidence score. Pro users additionally unlock Sortino ratio, CAGR, Calmar ratio, Recovery Factor, Expectancy, monthly returns chart, trade-by-trade analysis with learning mode, and PDF/Excel export.",
  },
  {
    question: "Can I export my results?",
    answer:
      "Pro users can export backtest results as PDF reports (with charts and metrics) or Excel spreadsheets (with trade logs and equity curve data). Free users can view all basic analytics within the platform.",
  },
  {
    question: "Does TradeTest support strategy versioning?",
    answer:
      "Yes. Every time you edit a strategy, a version snapshot is created automatically. Backtests are tied to the specific version they were run against, so your history is never overwritten. This is available on both Free and Pro plans.",
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">
            Frequently Asked
            <br />
            <span className="text-gradient-accent">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about TradeTest
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-accent/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
