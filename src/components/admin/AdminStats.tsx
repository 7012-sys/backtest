import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, TrendingUp, Activity } from "lucide-react";

interface AdminStatsProps {
  totalUsers: number;
  proUsers: number;
  totalBacktests: number;
  totalStrategies: number;
}

export const AdminStats = ({ totalUsers, proUsers, totalBacktests, totalStrategies }: AdminStatsProps) => {
  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      description: "Registered accounts",
    },
    {
      title: "Pro Subscribers",
      value: proUsers,
      icon: CreditCard,
      description: "Active paid users",
    },
    {
      title: "Total Backtests",
      value: totalBacktests,
      icon: TrendingUp,
      description: "Backtests run",
    },
    {
      title: "Strategies Created",
      value: totalStrategies,
      icon: Activity,
      description: "User strategies",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
