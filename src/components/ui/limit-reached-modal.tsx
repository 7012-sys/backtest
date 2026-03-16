import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown, Clock, ArrowRight } from "lucide-react";

export type LimitType = "backtest" | "ai_strategy" | "pro_feature" | "indicator" | "strategy" | "file_upload" | "timeframe" | "export";

interface LimitReachedModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  limitType: LimitType;
  featureName?: string;
  // Alternative props for simpler usage
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
}

const getLimitContent = (limitType: LimitType, featureName?: string, customTitle?: string, customDescription?: string) => {
  if (customTitle && customDescription) {
    return {
      title: customTitle,
      description: customDescription,
      icon: <Crown className="h-8 w-8 text-accent" />,
    };
  }
  
  switch (limitType) {
    case "backtest":
      return {
        title: "Backtest Limit Reached",
        description: "You've used all 30 backtests for this month. Upgrade to Pro for unlimited backtests, or wait until next month.",
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      };
    case "ai_strategy":
      return {
        title: "AI Strategy Disabled",
        description: "AI Strategy Generator is a PRO-only feature. Upgrade to unlock unlimited AI-powered strategy generation.",
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      };
    case "indicator":
      return {
        title: "PRO Indicator",
        description: "This indicator requires a Pro subscription. Upgrade to unlock all features.",
        icon: <Crown className="h-8 w-8 text-accent" />,
      };
    case "strategy":
      return {
        title: "Strategy Limit Reached",
        description: "Free plan allows up to 2 strategies. Upgrade to Pro for unlimited strategies.",
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      };
    case "file_upload":
      return {
        title: "CSV Upload — Pro Only",
        description: "CSV upload is a Pro-only feature. Upgrade to upload your own historical data (up to 50MB).",
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      };
    case "timeframe":
      return {
        title: "PRO Timeframe",
        description: "Intraday timeframes (5m, 15m, 1h) are PRO-only. Free plan only supports Daily timeframe.",
        icon: <Crown className="h-8 w-8 text-accent" />,
      };
    case "export":
      return {
        title: "Export Feature",
        description: "Export to PDF and Excel is a PRO-only feature. Upgrade to download your results.",
        icon: <Crown className="h-8 w-8 text-accent" />,
      };
    case "pro_feature":
      return {
        title: "Pro Feature",
        description: `${featureName || "This feature"} is only available on Pro. Upgrade now to unlock it.`,
        icon: <Crown className="h-8 w-8 text-accent" />,
      };
    default:
      return {
        title: "Limit Reached",
        description: "Upgrade for unlimited access.",
        icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      };
  }
};

export const LimitReachedModal = ({
  open,
  onOpenChange,
  limitType,
  featureName,
  // Alternative props
  isOpen,
  onClose,
  title: customTitle,
  description: customDescription,
}: LimitReachedModalProps) => {
  const navigate = useNavigate();
  
  // Support both open/onOpenChange and isOpen/onClose patterns
  const isModalOpen = open ?? isOpen ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (!newOpen && onClose) onClose();
  };
  
  const content = getLimitContent(limitType, featureName, customTitle, customDescription);

  const handleUpgrade = () => {
    handleOpenChange(false);
    navigate("/upgrade");
  };

  const handleDismiss = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <AnimatePresence>
          {isModalOpen && (
            <>
              <DialogHeader className="text-center pb-2">
                <motion.div
                  className="flex justify-center mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    {content.icon}
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <DialogTitle className="text-xl">{content.title}</DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    {content.description}
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              <motion.div
                className="space-y-3 pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {/* Pro Benefits */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">With Pro you get:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Unlimited backtests
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Unlimited AI strategies
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Advanced analytics & insights
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Priority support
                    </li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleUpgrade}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  {limitType !== "pro_feature" && (
                    <Button
                      variant="outline"
                      onClick={handleDismiss}
                      className="w-full"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Come Back Tomorrow
                    </Button>
                  )}
                  
                  {limitType === "pro_feature" && (
                    <Button
                      variant="ghost"
                      onClick={handleDismiss}
                      className="w-full text-muted-foreground"
                    >
                      Maybe Later
                    </Button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};