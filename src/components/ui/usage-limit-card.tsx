import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, AlertCircle, Crown, Infinity, Calendar } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { ProFeaturesModal } from "@/components/ui/pro-features-modal";

interface UsageLimitCardProps {
  title: string;
  subtitle: string;
  used: number;
  limit: number | null; // null = unlimited
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  progressColor: string;
  isPro?: boolean;
  expiryDate?: Date | null;
}

export const UsageLimitCard = ({
  title,
  subtitle,
  used,
  limit,
  icon: Icon,
  iconColor,
  iconBg,
  progressColor,
  isPro = false,
  expiryDate,
}: UsageLimitCardProps) => {
  const isUnlimited = limit === null;
  const remaining = isUnlimited ? null : Math.max(0, limit - used);
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isLimitReached = !isUnlimited && used >= limit;

  return (
    <Card className={`border-border shadow-card ${isLimitReached ? 'border-warning/50 bg-warning/5' : ''} ${isPro ? 'border-accent/30 bg-accent/5' : ''}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
          </div>
          <div className="text-right">
            {isUnlimited ? (
              <div className="flex items-center gap-1.5 text-accent">
                <Infinity className="h-5 w-5" />
                <span className="text-lg font-bold">Unlimited</span>
              </div>
            ) : (
              <>
                <div className={`text-lg font-bold ${isLimitReached ? 'text-warning' : 'text-foreground'}`}>
                  {used}/{limit}
                </div>
                <div className="text-xs text-muted-foreground">
                  {remaining} remaining
                </div>
              </>
            )}
          </div>
        </div>
        
        {!isUnlimited && (
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${isLimitReached ? 'bg-warning' : progressColor}`}
              style={{ width: `${percentage}%` }} 
            />
          </div>
        )}
        
        {isPro && expiryDate && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Valid until {expiryDate.toLocaleDateString()}</span>
          </div>
        )}
        
        {isLimitReached && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-warning">
              <AlertCircle className="h-3 w-3" />
              <span>Limit reached</span>
            </div>
            <ProFeaturesModal>
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            </ProFeaturesModal>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const UpgradeCard = () => {
  return (
    <Card className="border-border shadow-card bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">Upgrade to Pro</div>
            <div className="text-xs text-muted-foreground">Unlimited backtests & AI</div>
          </div>
          <ProFeaturesModal>
            <Button 
              size="sm" 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              ₹499/mo
              <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </ProFeaturesModal>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProStatusCardProps {
  expiryDate: Date | null;
  daysRemaining: number | null;
}

export const ProStatusCard = ({ expiryDate, daysRemaining }: ProStatusCardProps) => {
  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
              <Crown className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                Pro Plan
                <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full">Active</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Unlimited access to all features
              </div>
            </div>
          </div>
          <div className="text-right">
            {expiryDate && (
              <>
                <div className="text-sm font-medium text-foreground">
                  {daysRemaining} days left
                </div>
                <div className="text-xs text-muted-foreground">
                  Expires {expiryDate.toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};