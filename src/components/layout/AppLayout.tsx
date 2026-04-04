import { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { TrendingUp } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  backTo?: string;
  title?: string;
  subtitle?: string;
  onSignOut?: () => void;
  rightContent?: ReactNode;
  loading?: boolean;
}

export const AppLayout = ({
  children,
  showBack,
  backTo,
  title,
  subtitle,
  onSignOut,
  rightContent,
  loading = false
}: AppLayoutProps) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent animate-pulse flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-accent-foreground" />
          </div>
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        showBack={showBack}
        backTo={backTo}
        title={title}
        subtitle={subtitle}
        onSignOut={onSignOut}
        rightContent={rightContent}
      />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <FeedbackButton />
      <AppFooter />
    </div>
  );
};