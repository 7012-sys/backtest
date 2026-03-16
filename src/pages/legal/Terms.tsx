import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">Last Updated: January 7, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p>
            Welcome to Trade Strategy Backtester ("Platform", "We", "Us", "Our"). By accessing or using this application, website, or services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the Platform.
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be 18 years or older to use this Platform.</li>
              <li>You must be legally capable of entering into a binding contract under Indian law.</li>
              <li>This Platform is intended for Indian residents only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Nature of Service (IMPORTANT)</h2>
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-4">
              <p className="font-medium text-warning">⚠️ Educational Purpose Only</p>
            </div>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Platform is an <strong>educational and analytical tool only</strong>.</li>
              <li>We provide historical data analysis, backtesting tools, and AI-generated explanations.</li>
              <li>We <strong>do not</strong> provide:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Investment advice</li>
                  <li>Buy or sell recommendations</li>
                  <li>Trading signals</li>
                  <li>Guaranteed returns</li>
                </ul>
              </li>
              <li>All decisions taken based on information from the Platform are <strong>solely your responsibility</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. No SEBI Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Platform is <strong>not registered with SEBI</strong>.</li>
              <li>The Platform does not act as an investment advisor, research analyst, or broker.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. User Responsibilities</h2>
            <p>You agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trading and investing involve substantial risk.</li>
              <li>Past performance does not guarantee future results.</li>
              <li>You will independently verify any strategy before using it in live markets.</li>
              <li>You assume full responsibility for any financial outcomes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. AI Usage Disclosure</h2>
            <p>The Platform uses artificial intelligence (AI) to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Interpret user-written strategies</li>
              <li>Explain historical results</li>
            </ul>
            <div className="bg-muted rounded-lg p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                AI outputs are automated and may contain inaccuracies. AI responses are for educational purposes only and should not be considered advice.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Subscription & Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some features require a paid subscription.</li>
              <li>Subscription pricing is clearly displayed before payment.</li>
              <li>Payments are processed securely via Razorpay.</li>
              <li>By subscribing, you authorize recurring charges as per your selected plan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Refund & Cancellation</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>All subscription payments are non-refundable.</strong></li>
              <li>You may cancel your subscription at any time.</li>
              <li>Access will continue until the end of the billing period.</li>
              <li>No refunds will be issued for unused time.</li>
            </ul>
            <p className="mt-2">
              <Link to="/refund-policy" className="text-primary hover:underline">See Refund Policy for details.</Link>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Prohibited Activities</h2>
            <p>You must not:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Misuse or abuse the Platform</li>
              <li>Reverse engineer or copy the Platform</li>
              <li>Scrape data or use bots</li>
              <li>Use the Platform for illegal purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Account Suspension</h2>
            <p>We reserve the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Suspend or terminate accounts that violate these Terms</li>
              <li>Restrict access without prior notice in case of misuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All content, software, design, logic, and analytics belong to Trade Strategy Backtester.</li>
              <li>You may not copy, distribute, or resell any part of the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">11. Limitation of Liability</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We are not liable for any financial loss, trading loss, or missed opportunities.</li>
              <li>We are not responsible for inaccuracies in data or AI outputs.</li>
              <li>Our maximum liability, if any, is limited to the amount paid by you for the subscription.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We may update these Terms from time to time.</li>
              <li>Continued use of the Platform constitutes acceptance of updated Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">13. Governing Law</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>These Terms are governed by Indian law.</li>
              <li>Jurisdiction shall be the courts of India.</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            If you have any questions about these Terms, please contact us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
