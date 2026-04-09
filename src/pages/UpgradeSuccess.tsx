import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  Brain, 
  BarChart3, 
  Download, 
  HeadphonesIcon,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const proFeatures = [
  {
    icon: Brain,
    title: "Unlimited AI Strategies",
    description: "Generate as many AI-powered trading strategies as you need",
  },
  {
    icon: BarChart3,
    title: "Unlimited Backtests",
    description: "Run comprehensive backtests without any restrictions",
  },
  {
    icon: Zap,
    title: "Advanced Indicators",
    description: "Access professional-grade technical indicators",
  },
  {
    icon: Download,
    title: "Export Reports",
    description: "Download detailed CSV reports of your backtests",
  },
  {
    icon: HeadphonesIcon,
    title: "Priority Support",
    description: "Get fast, dedicated support when you need it",
  },
];

const AnimatedCheckmark = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay,
    }}
    className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white"
  >
    <motion.div
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3, delay: delay + 0.2 }}
    >
      <Check className="w-4 h-4" strokeWidth={3} />
    </motion.div>
  </motion.div>
);

const FloatingSparkle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute text-yellow-400"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ scale: 0, opacity: 0, rotate: 0 }}
    animate={{
      scale: [0, 1.2, 0],
      opacity: [0, 1, 0],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: 3,
    }}
  >
    <Sparkles className="w-6 h-6" />
  </motion.div>
);

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [proConfirmed, setProConfirmed] = useState(false);

  // Poll for pro status to handle webhook delay
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 15;
    const POLL_INTERVAL = 2000;

    const pollSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setSyncing(false);
        return;
      }

      while (!cancelled && attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          const { data, error } = await supabase
            .from("subscriptions")
            .select("plan, status")
            .eq("user_id", session.user.id)
            .single();

          if (!error && data?.plan === "pro" && data?.status === "active") {
            setProConfirmed(true);
            setSyncing(false);
            return;
          }
        } catch (e) {
          console.error("Poll error:", e);
        }
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
      }
      if (!cancelled) {
        // Even if polling times out, stop loading and show success
        setSyncing(false);
      }
    };

    pollSubscription();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Fire confetti on mount
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#FBBF24', '#F59E0B'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#FBBF24', '#F59E0B'],
      });
    }, 250);

    // Show content after a brief delay
    setTimeout(() => setShowContent(true), 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-emerald-950/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating sparkles */}
      <FloatingSparkle delay={0} x={10} y={20} />
      <FloatingSparkle delay={0.5} x={85} y={15} />
      <FloatingSparkle delay={1} x={20} y={70} />
      <FloatingSparkle delay={1.5} x={80} y={75} />
      <FloatingSparkle delay={2} x={50} y={10} />

      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-yellow-500/5 pointer-events-none" />

      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30"
          >
            <Crown className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-green-400 to-yellow-400 bg-clip-text text-transparent"
          >
            Welcome to Pro!
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-muted-foreground"
          >
            {syncing 
              ? "Verifying your Pro status..." 
              : "Your account has been upgraded successfully. Here's what you've unlocked:"}
          </motion.p>
        </motion.div>

        {/* Syncing indicator */}
        {syncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-muted-foreground"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Activating your Pro plan...</span>
          </motion.div>
        )}

        {/* Features List */}
        {showContent && !syncing && (
          <Card className="border-emerald-500/20 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {proFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: 0.1 + index * 0.1,
                    }}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <AnimatedCheckmark delay={0.2 + index * 0.1} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <feature.icon className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Button */}
        {!syncing && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 gap-2 px-8"
            >
              Start Building Strategies
              <ArrowRight className="w-5 h-5" />
            </Button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm text-muted-foreground mt-4"
            >
              {proConfirmed 
                ? "Your Pro subscription is now active. Enjoy unlimited access!" 
                : "If your Pro status doesn't reflect immediately, please refresh or contact support."}
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
