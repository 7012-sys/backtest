import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Disclaimer / Risk Disclosure</h1>
        <p className="text-muted-foreground mb-8">Last Updated: January 7, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-destructive mb-2">Risk Warning</h2>
                <p className="text-lg">
                  Trading and investing in the stock market involves substantial risk of loss and is not suitable for everyone. You should carefully consider whether trading is suitable for you in light of your financial condition.
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Educational Purpose Only</h2>
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
              <p className="font-medium">
                ⚠️ This platform is for <strong>educational and analytical purposes only</strong>. It does not provide investment advice, buy/sell recommendations, trading signals, or guaranteed returns.
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>All information provided is for educational purposes only</li>
              <li>Nothing on this platform should be construed as investment advice</li>
              <li>We do not recommend any specific investments or strategies</li>
              <li>Historical analysis does not predict future performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">No SEBI Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>TradeTest is <strong>NOT registered with SEBI</strong></li>
              <li>We are not an investment advisor or research analyst</li>
              <li>We are not a broker or sub-broker</li>
              <li>We do not hold any SEBI licenses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Past Performance Disclaimer</h2>
            <div className="bg-muted rounded-lg p-4 border">
              <p className="font-medium text-center">
                📊 Past performance is not indicative of future results
              </p>
            </div>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Backtested results are hypothetical and based on historical data</li>
              <li>Actual trading results may differ significantly from backtested results</li>
              <li>Market conditions change and strategies that worked in the past may not work in the future</li>
              <li>Backtests do not account for all market conditions, slippage, and execution risks</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Risk Factors</h2>
            <p>Trading in the stock market involves significant risks including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Market Risk:</strong> Prices can move against your position</li>
              <li><strong>Liquidity Risk:</strong> You may not be able to exit positions at desired prices</li>
              <li><strong>Execution Risk:</strong> Orders may not be filled at expected prices</li>
              <li><strong>Gap Risk:</strong> Prices can gap significantly between trading sessions</li>
              <li><strong>Technical Risk:</strong> System failures, connectivity issues, and data errors</li>
              <li><strong>Regulatory Risk:</strong> Changes in regulations can affect trading</li>
              <li><strong>Loss of Capital:</strong> You can lose some or all of your invested capital</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">AI Disclaimer</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-generated content is automated and may contain errors or inaccuracies</li>
              <li>AI responses are for educational purposes only</li>
              <li>Do not rely solely on AI outputs for trading decisions</li>
              <li>Always verify AI-generated strategies independently</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Data Accuracy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Historical data is sourced from third-party providers</li>
              <li>Data may contain errors, gaps, or inaccuracies</li>
              <li>We do not guarantee the accuracy or completeness of data</li>
              <li>Always cross-reference with official sources before making decisions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">User Responsibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are solely responsible for your trading decisions</li>
              <li>You should only trade with money you can afford to lose</li>
              <li>Consult a qualified financial advisor before trading</li>
              <li>Understand all risks before engaging in trading activities</li>
              <li>Test any strategy thoroughly before using real money</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We are not liable for any losses arising from the use of this platform</li>
              <li>We are not liable for trading decisions made based on our tools</li>
              <li>We are not liable for data inaccuracies or technical failures</li>
              <li>Our maximum liability is limited to the subscription fees paid</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Acknowledgment</h2>
            <p>
              By using this platform, you acknowledge that you have read, understood, and agree to this disclaimer. You understand the risks involved in trading and accept full responsibility for your actions.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              ⚠️ Educational Purpose Only. No Investment Advice. Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
