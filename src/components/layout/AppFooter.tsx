import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export const AppFooter = () => {
  return (
    <>
      {/* Compliance Banner */}
      <div className="bg-warning/10 border-t border-warning/20 px-4 py-3">
        <p className="text-center text-sm text-muted-foreground">
          ⚠️ <span className="font-medium">TradeTest is a research and educational tool.</span> Not registered with SEBI as advisory or broker. Not financial advice. Past performance does not guarantee future results.
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <span className="text-border">•</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <span className="text-border">•</span>
            <Link to="/refund-policy" className="hover:text-primary transition-colors">Refund</Link>
            <span className="text-border">•</span>
            <Link to="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3" />
            Your data is secure and encrypted
          </p>
        </div>
      </footer>
    </>
  );
};
