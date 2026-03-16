import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { LimitReachedModal } from "@/components/ui/limit-reached-modal";

interface ProFeatureLockProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  isUnlocked?: boolean;
  featureName?: string;
}

export const ProFeatureLock = ({ 
  title, 
  description, 
  icon: Icon = Lock,
  children,
  isUnlocked = false,
  featureName
}: ProFeatureLockProps) => {
  const [showModal, setShowModal] = useState(false);

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <>
      <Card className="relative border-border/50 bg-muted/30 overflow-hidden">
        <div className="absolute inset-0 backdrop-blur-[1px] bg-background/60 z-10 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-6 w-6 text-accent" />
            </div>
            <h4 className="font-semibold mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
            <Button 
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setShowModal(true)}
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
        {/* Show blurred preview of the feature */}
        <CardContent className="py-6 opacity-40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="h-4 w-32 bg-muted rounded mb-2" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <LimitReachedModal
        open={showModal}
        onOpenChange={setShowModal}
        limitType="pro_feature"
        featureName={featureName || title}
      />
    </>
  );
};

interface ProBadgeProps {
  className?: string;
}

export const ProBadge = ({ className = "" }: ProBadgeProps) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium ${className}`}>
    <Crown className="h-3 w-3" />
    Pro
  </span>
);
