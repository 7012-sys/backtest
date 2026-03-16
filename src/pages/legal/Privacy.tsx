import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: January 7, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <p>
            Trade Strategy Backtester ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Phone Number:</strong> Used for account authentication via OTP</li>
              <li><strong>Email Address:</strong> If provided, used for communications</li>
              <li><strong>Display Name:</strong> Optional, for personalization</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trading strategies you create</li>
              <li>Backtest results and analytics</li>
              <li>App usage patterns and preferences</li>
              <li>Device information and IP address</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Payment Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment transactions are processed by Razorpay</li>
              <li>We do not store your card details</li>
              <li>We retain subscription status and payment history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To authenticate and secure your account</li>
              <li>To provide and improve our services</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send service-related notifications</li>
              <li>To analyze usage patterns for improvements</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Data Storage and Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your data is stored securely on cloud servers</li>
              <li>We use industry-standard encryption (SSL/TLS)</li>
              <li>Access to data is restricted to authorized personnel only</li>
              <li>We regularly review and update security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Payment processors (Razorpay), cloud hosting, analytics</li>
              <li><strong>Legal Requirements:</strong> When required by law or legal process</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Cookies and Tracking</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We use essential cookies for authentication</li>
              <li>Analytics cookies help us understand usage patterns</li>
              <li>You can disable cookies in your browser settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Your Rights</h2>
            <p>Under applicable laws, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request data in a portable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us through the app or email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data is retained while your account is active</li>
              <li>After account deletion, data is removed within 30 days</li>
              <li>Some data may be retained for legal compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We use Yahoo Finance for market data</li>
              <li>Payments are processed by Razorpay</li>
              <li>These services have their own privacy policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through the app.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            This policy is compliant with applicable Indian data protection laws.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
