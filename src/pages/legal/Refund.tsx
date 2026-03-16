import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Refund = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">Refund & Cancellation Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: January 7, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>⚠️</span> Important Notice
            </h2>
            <p className="text-lg font-medium">
              All payments made for subscriptions are <strong>non-refundable</strong>.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Refund Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All subscription payments are non-refundable</li>
              <li>This includes partially used subscription periods</li>
              <li>We do not provide prorated refunds for early cancellation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Cancellation Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may cancel your subscription at any time from your account settings</li>
              <li>After cancellation, your access will remain active until the end of the current billing cycle</li>
              <li>You will not be charged for subsequent billing periods after cancellation</li>
              <li>Your data will be retained for 30 days after the subscription ends, after which it may be deleted</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Exceptions</h2>
            <p>Refunds will <strong>only</strong> be considered in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Duplicate Payment:</strong> If you were charged twice for the same subscription period</li>
              <li><strong>Technical Charging Errors:</strong> If there was a technical error resulting in incorrect charges</li>
            </ul>
            <p className="mt-4">
              In such cases, please contact us within 7 days of the charge with proof of the error.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">How to Cancel</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Go to your Account Settings</li>
              <li>Navigate to the Subscription section</li>
              <li>Click on "Cancel Subscription"</li>
              <li>Confirm your cancellation</li>
            </ol>
            <p className="mt-4 text-muted-foreground">
              You will receive a confirmation email once your cancellation is processed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Free Trial</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Free tier features are available without any payment</li>
              <li>No credit card is required for the free tier</li>
              <li>You can upgrade to paid plans at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              If you believe you qualify for a refund exception or have questions about cancellation, please contact us through the app.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            By subscribing to our services, you acknowledge that you have read and agree to this Refund & Cancellation Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Refund;
