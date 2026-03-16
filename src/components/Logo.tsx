import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = ({ className, size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(152, 76%, 55%)" />
              <stop offset="100%" stopColor="hsl(152, 76%, 40%)" />
            </linearGradient>
            <linearGradient id="innerShield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(240, 10%, 15%)" />
              <stop offset="100%" stopColor="hsl(240, 10%, 10%)" />
            </linearGradient>
            <linearGradient id="candleGreen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(152, 76%, 55%)" />
              <stop offset="100%" stopColor="hsl(152, 76%, 45%)" />
            </linearGradient>
            <linearGradient id="candleRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(0, 72%, 55%)" />
              <stop offset="100%" stopColor="hsl(0, 72%, 45%)" />
            </linearGradient>
          </defs>
          
          <path
            d="M24 4L6 12V22C6 33.05 13.56 43.22 24 46C34.44 43.22 42 33.05 42 22V12L24 4Z"
            fill="url(#shieldGradient)"
          />
          
          <path
            d="M24 7L9 14V22C9 31.39 15.42 40.01 24 42.8C32.58 40.01 39 31.39 39 22V14L24 7Z"
            fill="url(#innerShield)"
          />
          
          <rect x="13" y="18" width="4" height="12" rx="1" fill="url(#candleRed)" />
          <rect x="14.5" y="15" width="1" height="18" fill="hsl(0, 72%, 45%)" />
          
          <rect x="22" y="14" width="4" height="14" rx="1" fill="url(#candleGreen)" />
          <rect x="23.5" y="11" width="1" height="20" fill="hsl(152, 76%, 40%)" />
          
          <rect x="31" y="16" width="4" height="10" rx="1" fill="url(#candleGreen)" />
          <rect x="32.5" y="13" width="1" height="16" fill="hsl(152, 76%, 40%)" />
          
          <circle cx="36" cy="36" r="8" fill="hsl(152, 76%, 45%)" />
          <circle cx="36" cy="36" r="6.5" fill="hsl(152, 76%, 50%)" />
          
          <path
            d="M32.5 36L35 38.5L40 33.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {showText && (
        <span className={cn("font-bold font-heading text-foreground", textSizeClasses[size])}>
          TradeTest
        </span>
      )}
    </div>
  );
};