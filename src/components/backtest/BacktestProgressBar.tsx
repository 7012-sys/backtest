import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const STAGES = [
  { label: "Processing historical data...", progress: 25 },
  { label: "Applying strategy rules...", progress: 55 },
  { label: "Calculating metrics...", progress: 85 },
  { label: "Finalizing results...", progress: 95 },
];

interface BacktestProgressBarProps {
  isRunning: boolean;
  strategyName?: string;
  symbol?: string;
}

export const BacktestProgressBar = ({ isRunning, strategyName, symbol }: BacktestProgressBarProps) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setStageIndex(0);
      return;
    }

    const timers = STAGES.map((_, i) =>
      setTimeout(() => setStageIndex(i), i * 1200)
    );

    return () => timers.forEach(clearTimeout);
  }, [isRunning]);

  if (!isRunning) return null;

  const stage = STAGES[stageIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-border bg-card p-6 text-center space-y-4"
    >
      <Loader2 className="h-10 w-10 mx-auto animate-spin text-accent" />
      <div>
        <h3 className="font-heading font-semibold text-lg">Running Backtest</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Testing {strategyName || "strategy"} on {symbol || "data"}
        </p>
      </div>
      <Progress value={stage.progress} className="h-2" />
      <AnimatePresence mode="wait">
        <motion.p
          key={stageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-sm text-muted-foreground"
        >
          {stage.label}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
};
