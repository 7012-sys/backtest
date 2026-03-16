import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants, type Easing } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Brain, 
  BarChart3, 
  Upload, 
  Zap, 
  Shield, 
  TrendingUp,
  ArrowRight,
  Check,
  Sparkles
} from "lucide-react";

interface ProFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  preview: React.ReactNode;
}

const proFeatures: ProFeature[] = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: "AI Strategy Generator",
    description: "Generate trading strategies using advanced AI models",
    preview: (
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium">AI Generating...</span>
        </div>
        <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-accent rounded-full animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground">
          "Create a momentum-based strategy with RSI and MACD..."
        </p>
      </div>
    ),
  },
  {
    icon: <Upload className="h-5 w-5" />,
    title: "CSV Data Upload",
    description: "Upload your own historical data for custom backtests",
    preview: (
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="border-2 border-dashed border-accent/30 rounded-lg p-3 text-center">
          <Upload className="h-6 w-6 text-accent mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Drop CSV files here</p>
          <p className="text-[10px] text-muted-foreground/70">OHLCV format supported</p>
        </div>
      </div>
    ),
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Unlimited Backtests",
    description: "Run unlimited backtests without daily restrictions",
    preview: (
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">Backtests Today</span>
          <Badge variant="secondary" className="text-[10px]">Unlimited</Badge>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[85, 72, 91, 68, 79, 88].map((val, i) => (
            <div key={i} className="h-6 bg-accent/20 rounded flex items-end justify-center">
              <div 
                className="w-full bg-accent rounded-t" 
                style={{ height: `${val}%` }} 
              />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Advanced Analytics",
    description: "Detailed performance metrics and equity curves",
    preview: (
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-center">
            <p className="text-lg font-bold text-green-500">+24.5%</p>
            <p className="text-[10px] text-muted-foreground">Returns</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">1.85</p>
            <p className="text-[10px] text-muted-foreground">Profit Factor</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">68%</p>
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Priority Processing",
    description: "Faster backtest execution and AI generation",
    preview: (
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-medium">Priority Queue</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-green-500 rounded-full" />
            <span className="text-[10px] text-green-500">Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1/3 bg-muted-foreground/30 rounded-full" />
            <span className="text-[10px] text-muted-foreground">Free</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Strategy Health Monitor",
    description: "Real-time monitoring of your strategy performance",
    preview: (
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs">Strategy Active</span>
          </div>
          <Badge className="bg-green-500/20 text-green-500 text-[10px]">Healthy</Badge>
        </div>
      </div>
    ),
  },
];

interface ProFeaturesModalProps {
  children: React.ReactNode;
}

const easeOutQuart: Easing = [0.25, 0.46, 0.45, 0.94];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: easeOutQuart,
    },
  }),
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as Easing,
    },
  },
};

const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    },
  },
};

const footerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5,
      duration: 0.3,
    },
  },
};

export const ProFeaturesModal = ({ children }: ProFeaturesModalProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleUpgrade = () => {
    setOpen(false);
    navigate("/upgrade");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <AnimatePresence>
          {open && (
            <>
              <DialogHeader className="text-center pb-2">
                <motion.div
                  className="flex justify-center mb-3"
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <Crown className="h-7 w-7 text-accent" />
                  </div>
                </motion.div>
                <motion.div
                  variants={headerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <DialogTitle className="text-2xl">Unlock Pro Features</DialogTitle>
                  <DialogDescription className="text-base">
                    Supercharge your trading with advanced tools and unlimited access
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {proFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                      transition: { duration: 0.2 }
                    }}
                    className="flex gap-4 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-accent/30 transition-colors cursor-pointer"
                  >
                    <motion.div 
                      className="flex-shrink-0"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        {feature.icon}
                      </div>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{feature.title}</h4>
                        <Badge variant="secondary" className="text-[10px]">PRO</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {feature.description}
                      </p>
                      {feature.preview}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="border-t pt-4 space-y-3"
                variants={footerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  {["₹499/month", "All features unlocked", "Priority support"].map((text, i) => (
                    <motion.div 
                      key={text}
                      className="flex items-center gap-1.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{text}</span>
                    </motion.div>
                  ))}
                </div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
                >
                  <Button 
                    onClick={handleUpgrade} 
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Upgrade to Pro
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
