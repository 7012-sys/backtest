import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Settings, LogOut, ArrowLeft, Crown, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

interface AppHeaderProps {
  showBack?: boolean;
  backTo?: string;
  title?: string;
  subtitle?: string;
  onSignOut?: () => void;
  rightContent?: React.ReactNode;
}

export const AppHeader = ({ 
  showBack = false, 
  backTo = "/dashboard",
  title,
  subtitle,
  onSignOut,
  rightContent
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const { isPro, isLoading, isExpired } = useSubscription(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(backTo)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              {title && (
                <div>
                  <h1 className="font-bold text-lg text-foreground">{title}</h1>
                  {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                </div>
              )}
            </>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          
          {/* Pro Badge - active Pro users */}
          {!isLoading && isPro && !isExpired && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
              <Crown className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent">Pro</span>
            </div>
          )}
          
          {/* Upgrade to Pro - free users & expired Pro */}
          {!isLoading && (!isPro || isExpired) && userId && (
            <Button
              size="sm"
              onClick={() => navigate("/upgrade")}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 rounded-full px-4"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade to Pro
            </Button>
          )}
          
          {rightContent}
          {!rightContent && onSignOut && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground" 
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground" 
                onClick={onSignOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
