import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProFeatureLock } from "@/components/ui/pro-feature-lock";
interface PeriodData {
  period: string;
  pnl: number;
  trades: number;
  backtests: number;
}

interface TimePeriodPnLChartProps {
  weeklyData: PeriodData[];
  monthlyData: PeriodData[];
  loading?: boolean;
  isPro?: boolean;
}

export const TimePeriodPnLChart = ({ weeklyData, monthlyData, loading, isPro = false }: TimePeriodPnLChartProps) => {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            P&L by Time Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = view === "weekly" ? weeklyData : monthlyData;
  const hasData = data && data.length > 0;

  if (!hasData) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            P&L by Time Period
          </CardTitle>
          <CardDescription className="text-xs">
            Track your performance over weeks and months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No time-based data yet</p>
            <p className="text-xs mt-1 max-w-[220px] text-center">
              Run backtests to see how your P&L varies across different time periods
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPnL = data.reduce((sum, d) => sum + d.pnl, 0);
  const profitablePeriods = data.filter(d => d.pnl >= 0).length;
  const maxPnL = Math.max(...data.map(d => Math.abs(d.pnl)));
  const yDomain = [-maxPnL * 1.2, maxPnL * 1.2];

  const chartContent = (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              P&L by Time Period
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {view === "weekly" ? "Weekly" : "Monthly"} profit/loss breakdown
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "weekly" | "monthly")}>
              <TabsList className="h-8">
                <TabsTrigger value="weekly" className="text-xs px-3 h-6">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3 h-6">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
            <InfoTooltip 
              content={`Shows your ${view === "weekly" ? "weekly" : "monthly"} P&L. Green bars mean profit, red bars mean loss. Helps identify your best and worst performing periods.`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="text-xs text-muted-foreground">Total P&L</div>
            <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString()}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="text-xs text-muted-foreground">Profitable</div>
            <div className="text-sm font-bold text-foreground">
              {profitablePeriods}/{data.length}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <div className="text-xs text-muted-foreground">Avg P&L</div>
            <div className={`text-sm font-bold ${totalPnL / data.length >= 0 ? 'text-success' : 'text-destructive'}`}>
              {(totalPnL / data.length) >= 0 ? '+' : ''}₹{(totalPnL / data.length).toFixed(0)}
            </div>
          </div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                interval={0}
                angle={view === "weekly" ? -45 : 0}
                textAnchor={view === "weekly" ? "end" : "middle"}
                height={view === "weekly" ? 50 : 30}
              />
              <YAxis 
                domain={yDomain}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => {
                  if (Math.abs(value) >= 1000) {
                    return `₹${(value / 1000).toFixed(0)}k`;
                  }
                  return `₹${value}`;
                }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                width={50}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const data = payload[0].payload as PeriodData;
                  return (
                    <div className="p-2 text-sm">
                      <div className="font-semibold mb-1">{data.period}</div>
                      <div className={data.pnl >= 0 ? 'text-success' : 'text-destructive'}>
                        P&L: {data.pnl >= 0 ? '+' : ''}₹{data.pnl.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground text-xs mt-1">
                        {data.backtests} backtest{data.backtests !== 1 ? 's' : ''} • {data.trades} trade{data.trades !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Insights */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="w-2 h-2 rounded-sm bg-success" />
              Profit
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <span className="w-2 h-2 rounded-sm bg-destructive" />
              Loss
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {profitablePeriods >= data.length / 2 ? (
              <>
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success">Mostly profitable</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-destructive">Needs improvement</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProFeatureLock
      title="Time Period Analytics"
      description="Analyze your P&L trends across weeks and months"
      icon={Calendar}
      isUnlocked={isPro}
      featureName="Time Period P&L Analytics"
    >
      {chartContent}
    </ProFeatureLock>
  );
};
