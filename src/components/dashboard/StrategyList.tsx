import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Plus, ChevronRight, Sparkles, Clock, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  is_ai_generated: boolean | null;
  created_at: string;
  updated_at: string;
  lastBacktest?: {
    win_rate: number | null;
    net_pnl: number | null;
    total_trades: number | null;
  };
}

interface StrategyListProps {
  strategies: Strategy[];
  loading?: boolean;
  isPro?: boolean;
  onCreateStrategy?: () => void;
  onDeleteStrategy?: (id: string, name: string) => void;
}

export const StrategyList = ({ strategies, loading, isPro, onCreateStrategy, onDeleteStrategy }: StrategyListProps) => {
  const navigate = useNavigate();
  if (loading) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategies || strategies.length === 0) {
    return (
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Your Strategies</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <LineChart className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">No strategies yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Create your first strategy to get started</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-primary border-primary/30 hover:bg-primary/5"
              onClick={onCreateStrategy}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Your Strategies</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => navigate("/strategies")}>
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {strategies.slice(0, 5).map((strategy) => (
            <div 
              key={strategy.id} 
              className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/strategy/${strategy.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground text-sm">{strategy.name}</h4>
                  {strategy.is_ai_generated && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-accent/10 text-accent border-accent/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isPro && onDeleteStrategy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${strategy.name}"? This cannot be undone.`)) {
                          onDeleteStrategy(strategy.id, strategy.name);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
              
              {strategy.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{strategy.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(strategy.updated_at), "MMM d, yyyy")}
                </span>
                
                {strategy.lastBacktest && (
                  <>
                    {strategy.lastBacktest.win_rate !== null && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        Win: <span className="text-foreground font-medium">{strategy.lastBacktest.win_rate.toFixed(1)}%</span>
                      </span>
                    )}
                    {strategy.lastBacktest.net_pnl !== null && (
                      <span className={`flex items-center gap-1 ${strategy.lastBacktest.net_pnl >= 0 ? "text-success" : "text-destructive"}`}>
                        {strategy.lastBacktest.net_pnl >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        ₹{Math.abs(strategy.lastBacktest.net_pnl).toLocaleString()}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
