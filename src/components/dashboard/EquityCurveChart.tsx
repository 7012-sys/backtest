import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { ProFeatureLock } from "@/components/ui/pro-feature-lock";

interface EquityCurveChartProps {
  data: Array<{ date: string; equity: number }>;
  loading?: boolean;
  initialCapital?: number;
  isPro?: boolean;
}

export const EquityCurveChart = ({ data, loading, initialCapital = 100000, isPro = false }: EquityCurveChartProps) => {
  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Portfolio Equity Curve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            Portfolio Equity Curve
          </CardTitle>
          <CardDescription className="text-xs">
            Track how your portfolio value changes over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No equity data yet</p>
              <p className="text-xs mt-1 max-w-[200px]">
                Run backtests to see how your portfolio value would have grown or declined
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const startEquity = data[0]?.equity || initialCapital;
  const endEquity = data[data.length - 1]?.equity || initialCapital;
  const minEquity = Math.min(...data.map(d => d.equity));
  const maxEquity = Math.max(...data.map(d => d.equity));
  const isPositive = endEquity >= startEquity;
  const totalReturn = ((endEquity - startEquity) / startEquity) * 100;
  const absoluteReturn = endEquity - startEquity;

  const chartContent = (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Portfolio Equity Curve
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              How your portfolio value changed across backtests
            </CardDescription>
          </div>
          <InfoTooltip 
            content="This shows your cumulative portfolio value. An upward trend means your strategies are profitable overall. The line should ideally go up and to the right!" 
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Starting Capital</div>
            <div className="text-sm font-semibold">₹{startEquity.toLocaleString()}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Current Value</div>
            <div className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              ₹{endEquity.toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-success" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            )}
            <span className={`text-sm font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{totalReturn.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                domain={[minEquity * 0.98, maxEquity * 1.02]}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                width={55}
              />
              <ReferenceLine 
                y={startEquity} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5" 
                label={{ 
                  value: 'Start', 
                  position: 'insideTopRight', 
                  fontSize: 9,
                  fill: "hsl(var(--muted-foreground))"
                }} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                formatter={(value: number) => {
                  const returnPct = ((value - startEquity) / startEquity) * 100;
                  return [
                    <div key="tooltip">
                      <div className="font-medium">₹{value.toLocaleString()}</div>
                      <div className={`text-xs ${returnPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}% from start
                      </div>
                    </div>,
                    'Portfolio Value'
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Each point represents a backtest result</span>
          <span className="flex items-center gap-1">
            <span className={`w-8 h-0.5 ${isPositive ? 'bg-success' : 'bg-destructive'}`} />
            Equity Line
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProFeatureLock
      title="Equity Curve Chart"
      description="Track your portfolio growth over time with detailed equity visualization"
      icon={TrendingUp}
      isUnlocked={isPro}
      featureName="Equity Curve Analytics"
    >
      {chartContent}
    </ProFeatureLock>
  );
};
