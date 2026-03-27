import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Settings, LogOut, ArrowLeft, Crown } from "lucide-react";
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
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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
                    <div className="min-w-0">
                      <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
                      {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                  )}
                </>
              ) : (
                <Link to="/dashboard" className="flex items-center gap-2">
                  <Logo size="sm" />
                </Link>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <ThemeToggle />

              {!isLoading && isPro && !isExpired && (
                <>
                  <div className="hidden items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 sm:flex">
                    <Crown className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-semibold text-accent">Pro</span>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/10 sm:hidden">
                    <Crown className="h-4 w-4 text-accent" />
                  </div>
                </>
              )}

              {!isLoading && (!isPro || isExpired) && userId && (
                <>
                  <Button
                    size="icon"
                    onClick={() => navigate("/upgrade")}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 sm:hidden"
                  >
                    <Crown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/upgrade")}
                    className="hidden gap-1.5 rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/90 sm:inline-flex"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </Button>
                </>
              )}

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

          {rightContent && <div className="w-full sm:w-auto sm:shrink-0">{rightContent}</div>}
        </div>
      </div>
    </header>
  );
};
