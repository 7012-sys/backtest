import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Lock } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { TradeFilters, TradeFiltersState, getDefaultFilters } from "./TradeFilters";
import { LimitReachedModal } from "@/components/ui/limit-reached-modal";

interface Trade {
  id: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  side: "long" | "short";
  quantity: number;
  pnl: number;
  pnlPercent: number;
  holdingDays: number;
}

interface TradeTableProps {
  trades: Trade[];
  isPro: boolean;
}

type SortKey = "entryDate" | "exitDate" | "entryPrice" | "exitPrice" | "pnl" | "pnlPercent" | "holdingDays" | "quantity";
type SortDirection = "asc" | "desc";

const TRADES_PER_PAGE = 20;

export const TradeTable = ({ trades, isPro }: TradeTableProps) => {
  const [filters, setFilters] = useState<TradeFiltersState>(getDefaultFilters());
  const [sortKey, setSortKey] = useState<SortKey>("entryDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);

  // Apply filters
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      // Date filter
      if (filters.dateFrom && new Date(trade.entryDate) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(trade.exitDate) > new Date(filters.dateTo)) {
        return false;
      }

      // Trade type filter
      if (filters.tradeType === "wins" && trade.pnl < 0) return false;
      if (filters.tradeType === "losses" && trade.pnl >= 0) return false;

      // P&L filter (PRO only)
      if (isPro) {
        if (filters.pnlFilter === "profit" && trade.pnl < 0) return false;
        if (filters.pnlFilter === "loss" && trade.pnl >= 0) return false;
        if (filters.pnlFilter === "custom") {
          if (filters.pnlMin !== undefined && trade.pnl < filters.pnlMin) return false;
          if (filters.pnlMax !== undefined && trade.pnl > filters.pnlMax) return false;
        }

        // Duration filter
        if (filters.durationFilter === "short" && trade.holdingDays >= 7) return false;
        if (filters.durationFilter === "medium" && (trade.holdingDays < 7 || trade.holdingDays > 30)) return false;
        if (filters.durationFilter === "long" && trade.holdingDays <= 30) return false;
      }

      return true;
    });
  }, [trades, filters, isPro]);

  // Apply sorting
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let aVal: number | string = a[sortKey];
      let bVal: number | string = b[sortKey];

      if (sortKey === "entryDate" || sortKey === "exitDate") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [filteredTrades, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedTrades.length / TRADES_PER_PAGE);
  const paginatedTrades = sortedTrades.slice(
    (currentPage - 1) * TRADES_PER_PAGE,
    currentPage * TRADES_PER_PAGE
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ChevronsUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  const handleExport = () => {
    if (!isPro) {
      setShowExportModal(true);
      return;
    }
    // Export logic for PRO users
    const csvContent = [
      ["#", "Entry Date", "Entry Price", "Exit Date", "Exit Price", "Qty", "P&L", "P&L %", "Duration"].join(","),
      ...sortedTrades.map((trade, i) =>
        [
          i + 1,
          trade.entryDate,
          trade.entryPrice,
          trade.exitDate,
          trade.exitPrice,
          trade.quantity,
          trade.pnl,
          trade.pnlPercent,
          trade.holdingDays,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters(getDefaultFilters());
    setCurrentPage(1);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      {/* Header with filters and export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TradeFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setCurrentPage(1);
            }}
            isPro={isPro}
            onClear={clearFilters}
          />
          <span className="text-sm text-muted-foreground">
            {filteredTrades.length} of {trades.length} trades
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          {isPro ? (
            <Download className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("entryDate")}
              >
                <div className="flex items-center gap-1">
                  Entry Date
                  <SortIcon column="entryDate" />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("entryPrice")}
              >
                <div className="flex items-center justify-end gap-1">
                  Entry ₹
                  <SortIcon column="entryPrice" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("exitDate")}
              >
                <div className="flex items-center gap-1">
                  Exit Date
                  <SortIcon column="exitDate" />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("exitPrice")}
              >
                <div className="flex items-center justify-end gap-1">
                  Exit ₹
                  <SortIcon column="exitPrice" />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("quantity")}
              >
                <div className="flex items-center justify-end gap-1">
                  Qty
                  <SortIcon column="quantity" />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("pnl")}
              >
                <div className="flex items-center justify-end gap-1">
                  P&L
                  <SortIcon column="pnl" />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("pnlPercent")}
              >
                <div className="flex items-center justify-end gap-1">
                  %
                  <SortIcon column="pnlPercent" />
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => handleSort("holdingDays")}
              >
                <div className="flex items-center justify-end gap-1">
                  Days
                  <SortIcon column="holdingDays" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No trades match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTrades.map((trade, i) => (
                <TableRow key={trade.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-muted-foreground text-xs">
                    {(currentPage - 1) * TRADES_PER_PAGE + i + 1}
                  </TableCell>
                  <TableCell className="text-xs">{trade.entryDate}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    ₹{trade.entryPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs">{trade.exitDate}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    ₹{trade.exitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-xs">{trade.quantity}</TableCell>
                  <TableCell
                    className={`text-right font-medium text-xs ${
                      trade.pnl >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {trade.pnl >= 0 ? "+" : ""}₹{trade.pnl.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell
                    className={`text-right text-xs ${
                      trade.pnlPercent >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent}%
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {trade.holdingDays}d
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <LimitReachedModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        limitType="export"
        title="Export is PRO Only"
        description="Upgrade to PRO to export your trade history to CSV and Excel formats."
      />
    </div>
  );
};
