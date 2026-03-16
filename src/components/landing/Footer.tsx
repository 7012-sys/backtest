import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Mail, Instagram } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-4">
              <Logo size="md" />
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-sm mb-6">
              India's #1 educational platform for studying how trading strategies 
              perform on historical market data. For learning purposes only.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/tradetest_official/" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="mailto:tradetestofficial@gmail.com" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-colors">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold font-heading mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="#features" className="hover:text-primary-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-primary-foreground transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-primary-foreground transition-colors">FAQ</a></li>
              <li><a href="#testimonials" className="hover:text-primary-foreground transition-colors">Testimonials</a></li>
              <li><Link to="/disclaimer" className="hover:text-primary-foreground transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold font-heading mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/disclaimer" className="hover:text-primary-foreground transition-colors">Disclaimer</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary-foreground transition-colors">Refund Policy</Link></li>
              <li><Link to="/disclaimer" className="hover:text-primary-foreground transition-colors">Disclosures</Link></li>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="font-semibold font-heading mb-4">Get Started</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/auth" className="hover:text-primary-foreground transition-colors">Sign Up Free</Link></li>
              <li><Link to="/auth" className="hover:text-primary-foreground transition-colors">Sign In</Link></li>
              <li><Link to="/upgrade" className="hover:text-primary-foreground transition-colors">Upgrade to Pro</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compliance / SEBI disclaimer */}
      <div className="border-t border-primary-foreground/10 bg-primary-foreground/5">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-primary-foreground/60 max-w-3xl mx-auto leading-relaxed">
            ⚠️ <span className="font-medium">DISCLAIMER:</span> TradeTest is a <strong>research and educational tool</strong> designed for academic study of historical market data. 
            We do NOT provide trading tips, investment advice, buy/sell recommendations, or guaranteed returns. 
            We are NOT registered with SEBI as an investment advisor, research analyst, or broker. 
            All simulations use hypothetical scenarios on past data. Past performance does not guarantee future results. 
            Users are solely responsible for their own financial decisions. Consult a SEBI-registered advisor before making any investment.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} TradeTest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
