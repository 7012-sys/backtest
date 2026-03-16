import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, TrendingUp, Settings2, IndianRupee } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LiveSummaryPanelProps {
  datasetName: string;
  timeframe: string;
  dateRange: { start: string; end: string };
  strategyName: string | null;
  strategyVersion?: number;
  capital: string;
  commission: string;
  slippage: string;
  dataSourceMode: "market" | "csv";
  csvFileName?: string | null;
}

export const LiveSummaryPanel = ({
  datasetName,
  timeframe,
  dateRange,
  strategyName,
  strategyVersion,
  capital,
  commission,
  slippage,
  dataSourceMode,
  csvFileName,
}: LiveSummaryPanelProps) => {
  const formatCapital = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "—";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  };

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-accent" />
          Live Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Data Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <Database className="h-3 w-3" />
            Data
          </div>
          <div className="space-y-1.5 pl-5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dataset</span>
              <span className="font-medium">{dataSourceMode === "csv" && csvFileName ? csvFileName : datasetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timeframe</span>
              <Badge variant="secondary" className="text-xs font-normal">{timeframe}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Range</span>
              <span className="text-xs">
                {formatDate(dateRange.start)} → {formatDate(dateRange.end)}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Strategy Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <TrendingUp className="h-3 w-3" />
            Strategy
          </div>
          <div className="space-y-1.5 pl-5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium truncate max-w-[140px]">{strategyName || "Not selected"}</span>
            </div>
            {strategyVersion != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <Badge variant="outline" className="text-xs">V{strategyVersion}</Badge>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Settings Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <IndianRupee className="h-3 w-3" />
            Settings
          </div>
          <div className="space-y-1.5 pl-5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capital</span>
              <span className="font-medium">{formatCapital(capital)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission</span>
              <span>{commission}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span>{slippage}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
