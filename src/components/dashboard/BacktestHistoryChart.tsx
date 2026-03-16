import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { History } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface BacktestResult {
  id: string;
  symbol: string;
  netPnL: number;
  winRate: number;
  date: string;
}

interface BacktestHistoryChartProps {
  backtests: BacktestResult[];
  loading?: boolean;
}

export const BacktestHistoryChart = ({ backtests, loading }: BacktestHistoryChartProps) => {
  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-accent" />
            Backtest Results History
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

  if (!backtests || backtests.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-accent" />
            Backtest Results History
          </CardTitle>
          <CardDescription className="text-xs">
            P&L from each backtest run
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
            <History className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No backtests run yet</p>
            <p className="text-xs mt-1">Each bar will show profit/loss from a backtest</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take last 10 backtests
  const chartData = backtests.slice(0, 10).reverse().map((bt, index) => ({
    name: bt.symbol.length > 8 ? bt.symbol.substring(0, 8) + '...' : bt.symbol,
    fullName: bt.symbol,
    pnl: bt.netPnL,
    winRate: bt.winRate,
    date: bt.date,
    index: index + 1,
  }));

  const maxPnL = Math.max(...chartData.map(d => Math.abs(d.pnl)));
  const yDomain = [-maxPnL * 1.2, maxPnL * 1.2];

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-accent" />
              Backtest Results History
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Profit/Loss from your last {chartData.length} backtests
            </CardDescription>
          </div>
          <InfoTooltip 
            content="Each bar represents one backtest. Green bars = profitable, Red bars = loss. The zero line helps you see which backtests made money." 
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
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
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string, props: any) => {
                  return [
                    <div key="content" className="text-sm">
                      <div className="font-medium">{props.payload.fullName}</div>
                      <div className={value >= 0 ? 'text-success' : 'text-destructive'}>
                        P&L: {value >= 0 ? '+' : ''}₹{value.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">
                        Win Rate: {props.payload.winRate?.toFixed(1) || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {props.payload.date}
                      </div>
                    </div>,
                    ''
                  ];
                }}
                labelFormatter={() => ''}
              />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Profitable: {chartData.filter(d => d.pnl >= 0).length}/{chartData.length} backtests
          </span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-success" />
              Profit
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-destructive" />
              Loss
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
