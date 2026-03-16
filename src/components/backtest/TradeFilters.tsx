import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, Lock, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LimitReachedModal } from "@/components/ui/limit-reached-modal";

export interface TradeFiltersState {
  dateFrom: string;
  dateTo: string;
  tradeType: "all" | "wins" | "losses";
  pnlFilter: "all" | "profit" | "loss" | "custom";
  pnlMin?: number;
  pnlMax?: number;
  durationFilter: "all" | "short" | "medium" | "long";
}

interface TradeFiltersProps {
  filters: TradeFiltersState;
  onFiltersChange: (filters: TradeFiltersState) => void;
  isPro: boolean;
  onClear: () => void;
}

export const TradeFilters = ({ filters, onFiltersChange, isPro, onClear }: TradeFiltersProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    filters.tradeType !== "all" || 
    filters.pnlFilter !== "all" || 
    filters.durationFilter !== "all";

  const handleProFeatureClick = () => {
    if (!isPro) {
      setShowUpgradeModal(true);
    }
  };

  const updateFilter = <K extends keyof TradeFiltersState>(key: K, value: TradeFiltersState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filter Trades</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            {/* Date Range - Available to all */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Trade Type - Available to all */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Trade Type</Label>
              <Select
                value={filters.tradeType}
                onValueChange={(value) => updateFilter("tradeType", value as TradeFiltersState["tradeType"])}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="wins">Winning Trades</SelectItem>
                  <SelectItem value="losses">Losing Trades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* P&L Filter - PRO only */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                P&L Range
                {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Select
                value={filters.pnlFilter}
                onValueChange={(value) => {
                  if (!isPro) {
                    handleProFeatureClick();
                    return;
                  }
                  updateFilter("pnlFilter", value as TradeFiltersState["pnlFilter"]);
                }}
                disabled={!isPro}
              >
                <SelectTrigger className={`h-8 text-xs ${!isPro ? "opacity-60" : ""}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="profit">Profit Only</SelectItem>
                  <SelectItem value="loss">Loss Only</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {isPro && filters.pnlFilter === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min ₹"
                    value={filters.pnlMin || ""}
                    onChange={(e) => updateFilter("pnlMin", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max ₹"
                    value={filters.pnlMax || ""}
                    onChange={(e) => updateFilter("pnlMax", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Duration Filter - PRO only */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                Trade Duration
                {!isPro && <Lock className="h-3 w-3 text-muted-foreground" />}
              </Label>
              <Select
                value={filters.durationFilter}
                onValueChange={(value) => {
                  if (!isPro) {
                    handleProFeatureClick();
                    return;
                  }
                  updateFilter("durationFilter", value as TradeFiltersState["durationFilter"]);
                }}
                disabled={!isPro}
              >
                <SelectTrigger className={`h-8 text-xs ${!isPro ? "opacity-60" : ""}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  <SelectItem value="short">&lt;7 days</SelectItem>
                  <SelectItem value="medium">7-30 days</SelectItem>
                  <SelectItem value="long">&gt;30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <LimitReachedModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        limitType="export"
        title="PRO Feature"
        description="Advanced filters like P&L range and trade duration are available with PRO. Upgrade to unlock all filtering options."
      />
    </>
  );
};

export const getDefaultFilters = (): TradeFiltersState => ({
  dateFrom: "",
  dateTo: "",
  tradeType: "all",
  pnlFilter: "all",
  pnlMin: undefined,
  pnlMax: undefined,
  durationFilter: "all",
});
