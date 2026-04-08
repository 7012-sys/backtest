import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useReferralDetection } from "@/hooks/useReferral";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
      setChecking(false);
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <div className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />

        {/* Final CTA */}
        <section className="py-20 bg-muted border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-4">
              Ready to study strategy performance?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join 10,000+ learners exploring historical strategy analysis.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="h-14 px-10 font-semibold bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
            >
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Index;
