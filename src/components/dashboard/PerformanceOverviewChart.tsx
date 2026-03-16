import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { TrendingUp, HelpCircle } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface PerformanceData {
  name: string;
  value: number;
  color: string;
  description: string;
}

interface PerformanceOverviewChartProps {
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalReturn: number;
  loading?: boolean;
}

export const PerformanceOverviewChart = ({ 
  winRate, 
  profitFactor, 
  maxDrawdown, 
  totalReturn,
  loading 
}: PerformanceOverviewChartProps) => {
  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasData = winRate > 0 || profitFactor > 0 || totalReturn !== 0;

  if (!hasData) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Performance Overview
          </CardTitle>
          <CardDescription className="text-xs">
            Key metrics from your backtests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">Run backtests to see performance metrics</p>
            <p className="text-xs mt-1">These metrics help you evaluate your strategy</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data: PerformanceData[] = [
    { 
      name: "Win Rate", 
      value: winRate, 
      color: winRate >= 50 ? "hsl(var(--success))" : "hsl(var(--warning))",
      description: "Percentage of winning trades"
    },
    { 
      name: "Profit Factor", 
      value: Math.min(profitFactor * 20, 100), // Scale for visualization
      color: profitFactor >= 1.5 ? "hsl(var(--success))" : profitFactor >= 1 ? "hsl(var(--warning))" : "hsl(var(--destructive))",
      description: "Ratio of gross profit to gross loss"
    },
    { 
      name: "Capital Safety", 
      value: Math.max(100 - Math.abs(maxDrawdown), 0), 
      color: maxDrawdown <= 10 ? "hsl(var(--success))" : maxDrawdown <= 20 ? "hsl(var(--warning))" : "hsl(var(--destructive))",
      description: "How much capital is protected (100 - drawdown)"
    },
  ];

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Performance Overview
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Key metrics from your backtests (higher is better)
            </CardDescription>
          </div>
          <InfoTooltip 
            content="This chart shows your overall trading performance. Green = Good, Yellow = Average, Red = Needs improvement" 
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                width={75}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string, props: any) => {
                  const item = data.find(d => d.name === props.payload.name);
                  let displayValue = value;
                  if (props.payload.name === "Profit Factor") {
                    displayValue = profitFactor;
                    return [`${displayValue.toFixed(2)}x`, item?.description];
                  }
                  if (props.payload.name === "Win Rate") {
                    return [`${winRate.toFixed(1)}%`, item?.description];
                  }
                  return [`${(100 - maxDrawdown).toFixed(1)}%`, item?.description];
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with explanations */}
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Average</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Needs Work</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
