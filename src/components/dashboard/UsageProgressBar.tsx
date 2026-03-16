import { Progress } from "@/components/ui/progress";

interface UsageProgressBarProps {
  label: string;
  used: number;
  limit: number | null;
  icon?: React.ReactNode;
}

export const UsageProgressBar = ({ label, used, limit, icon }: UsageProgressBarProps) => {
  if (limit === null) {
    return (
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">Unlimited</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
      </div>
    );
  }

  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <span className={`text-xs font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
            {used}/{limit}
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}`} 
        />
      </div>
    </div>
  );
};
