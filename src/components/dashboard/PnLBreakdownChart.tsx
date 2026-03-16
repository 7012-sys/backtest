import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface PnLBreakdownChartProps {
  winningPnL: number;
  losingPnL: number;
  winningTrades: number;
  losingTrades: number;
  loading?: boolean;
}

export const PnLBreakdownChart = ({ 
  winningPnL, 
  losingPnL, 
  winningTrades,
  losingTrades,
  loading 
}: PnLBreakdownChartProps) => {
  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            Profit & Loss Breakdown
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

  const totalTrades = winningTrades + losingTrades;
  const hasData = totalTrades > 0;

  if (!hasData) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            Profit & Loss Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Win vs loss distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <DollarSign className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No trade data available yet</p>
            <p className="text-xs mt-1">Run backtests to see your P&L breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { 
      name: "Winning Trades", 
      value: winningTrades, 
      pnl: winningPnL,
      color: "hsl(var(--success))" 
    },
    { 
      name: "Losing Trades", 
      value: losingTrades, 
      pnl: Math.abs(losingPnL),
      color: "hsl(var(--destructive))" 
    },
  ];

  const netPnL = winningPnL - Math.abs(losingPnL);
  const avgWin = winningTrades > 0 ? winningPnL / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? Math.abs(losingPnL) / losingTrades : 0;

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              Profit & Loss Breakdown
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Distribution of winning vs losing trades
            </CardDescription>
          </div>
          <InfoTooltip 
            content="This shows how your trades are split between winners and losers. A good strategy has more green than red!" 
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-[160px] w-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} trades (₹${props.payload.pnl.toLocaleString()})`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Stats breakdown */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-success/10">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Winners</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-success">
                  {winningTrades} trades
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg: ₹{avgWin.toFixed(0)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/10">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Losers</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-destructive">
                  {losingTrades} trades
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg: ₹{avgLoss.toFixed(0)}
                </div>
              </div>
            </div>
            
            <div className={`flex items-center justify-between p-2 rounded-lg ${netPnL >= 0 ? 'bg-success/5 border border-success/20' : 'bg-destructive/5 border border-destructive/20'}`}>
              <span className="text-sm font-medium">Net P&L</span>
              <span className={`text-sm font-bold ${netPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {netPnL >= 0 ? '+' : ''}₹{netPnL.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
