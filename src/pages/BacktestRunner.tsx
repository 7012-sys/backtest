import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Loader2,
  BarChart3,
  Calendar,
  IndianRupee,
  TrendingUp,
  AlertCircle,
  Upload,
  Database,
  Crown,
  Lock,
  Target,
  Pencil,
  Info,
  CheckCircle2,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { BacktestResults } from "@/components/backtest/BacktestResults";
import { CSVUploader } from "@/components/backtest/CSVUploader";
import { BacktestProgressBar } from "@/components/backtest/BacktestProgressBar";
import { NoTradesState } from "@/components/backtest/NoTradesState";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useUsageLimits, FREE_TIMEFRAMES } from "@/hooks/useUsageLimits";
import { ProBadge } from "@/components/ui/pro-feature-lock";
import { LimitReachedModal, LimitType } from "@/components/ui/limit-reached-modal";
import { generatePriceData, runBacktest as executeBacktest, OHLCV, StrategyRule } from "@/lib/backtestEngine";
import { normalizeAIRules } from "@/lib/backtest/strategyParser";
import { runWalkForwardValidation, getDefaultWalkForwardConfig } from "@/lib/backtest/walkForward";
import type { WalkForwardResult } from "@/lib/backtest/walkForward";
import { motion, AnimatePresence } from "framer-motion";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  current_version: number;
  is_ai_generated: boolean | null;
  rules: any;
}

// Free users: only NIFTY50, past 3 years. Pro users: all datasets, full history.
const ALL_DATASETS = [
  { value: "NIFTY50", label: "NIFTY 50", availableFrom: "2010-01-01", isFree: true },
  { value: "BANKNIFTY", label: "NIFTY Bank", availableFrom: "2010-01-01", isFree: false },
  { value: "RELIANCE", label: "RELIANCE", availableFrom: "2010-01-01", isFree: false },
  { value: "TCS", label: "TCS", availableFrom: "2010-01-01", isFree: false },
  { value: "HDFCBANK", label: "HDFC BANK", availableFrom: "2010-01-01", isFree: false },
  { value: "INFY", label: "INFOSYS", availableFrom: "2010-01-01", isFree: false },
];

const getFreeStartDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  return d.toISOString().split("T")[0];
};

// Max end date is yesterday since today's data isn't complete
const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
};
const YESTERDAY = getYesterday();

const TIMEFRAMES = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "1d", label: "Daily" },
  { value: "1w", label: "Weekly" },
];

type DataSourceMode = "market" | "csv";
type CsvSubMode = "upload" | "library";

interface LibraryFile {
  id: string;
  file_name: string;
  symbol: string;
  timeframe: string;
  row_count: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
}

const BacktestRunner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  // Data source
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>("market");
  const [symbol, setSymbol] = useState<string>("NIFTY50");
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvTimeframe, setCsvTimeframe] = useState<string | null>(null);
  const [csvDateMin, setCsvDateMin] = useState<string>("");
  const [csvDateMax, setCsvDateMax] = useState<string>("");

  // Strategy
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");

  // Settings
  const [timeframe, setTimeframe] = useState<string>("1d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [initialCapital, setInitialCapital] = useState<string>("100000");
  const [commissionPercent, setCommissionPercent] = useState<string>("0.03");
  const [slippagePercent, setSlippagePercent] = useState<string>("0.05");
  const [positionSizing, setPositionSizing] = useState<string>("95");
  const [enableShorts, setEnableShorts] = useState(false);
  const [riskRewardRatio, setRiskRewardRatio] = useState<string>("manual");
  const [stopLossPercent, setStopLossPercent] = useState<string>("3");
  const [takeProfitPercent, setTakeProfitPercent] = useState<string>("5");
  const [enableWalkForward, setEnableWalkForward] = useState(false);

  const effectiveTP = riskRewardRatio === "manual"
    ? parseFloat(takeProfitPercent) || 5
    : (parseFloat(stopLossPercent) || 3) * parseFloat(riskRewardRatio);

  // CSV sub-mode & library
  const [csvSubMode, setCsvSubMode] = useState<CsvSubMode>("upload");
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryFile, setSelectedLibraryFile] = useState<string>("");
  const [libraryFileLoading, setLibraryFileLoading] = useState(false);

  // Results
  const [results, setResults] = useState<any>(null);
  const [walkForwardResult, setWalkForwardResult] = useState<WalkForwardResult | null>(null);
  const [usedFallbackData, setUsedFallbackData] = useState(false);

  // Modal
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<LimitType>("backtest");

  const { canRunBacktest, monthlyBacktestsUsed, backtestLimit, isPro: usagePro, expiryDate, refresh, isTimeframeAllowed } = useUsageLimits(user?.id);

  // Auth
  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });
    const today = new Date();
    setEndDate(YESTERDAY);
    // Default start date will be set once usagePro is known
    const threeYearsAgo = new Date(today);
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    setStartDate(threeYearsAgo.toISOString().split("T")[0]);
    return () => authSub.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchStrategies();
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && user) fetchStrategies();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user]);

  useEffect(() => {
    const strategyId = searchParams.get("strategy");
    if (strategyId && strategies.length > 0) setSelectedStrategy(strategyId);
  }, [searchParams, strategies]);

  const fetchStrategies = async () => {
    const { data, error } = await supabase
      .from("strategies")
      .select("id, name, description, rules, current_version, is_ai_generated")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load strategies"); return; }
    const list = data || [];
    setStrategies(list);
    if (list.length === 0) {
      setSelectedStrategy("");
    } else if (!selectedStrategy || !list.find(s => s.id === selectedStrategy)) {
      setSelectedStrategy(list[0].id);
    }
  };

  const selectedStrategyData = strategies.find(s => s.id === selectedStrategy);

  const fetchLibraryFiles = async () => {
    if (!user) return;
    setLibraryLoading(true);
    const { data, error } = await supabase
      .from("uploaded_files")
      .select("id, file_name, symbol, timeframe, row_count, date_range_start, date_range_end")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setLibraryFiles(data);
    setLibraryLoading(false);
  };

  const loadLibraryFile = async (fileId: string) => {
    if (!user) return;
    setLibraryFileLoading(true);
    try {
      const file = libraryFiles.find(f => f.id === fileId);
      if (!file) throw new Error("File not found");
      const { data: blob, error } = await supabase.storage.from("csv-data").download(`${user.id}/${fileId}.csv`);
      if (error || !blob) throw new Error("Could not download file");
      const text = await blob.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headerRow = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const autoMap: Record<string, number> = {};
      headerRow.forEach((h, i) => {
        const l = h.toLowerCase();
        if (l.includes('date') || l.includes('time')) autoMap.date = i;
        else if (l === 'open' || l === 'o') autoMap.open = i;
        else if (l === 'high' || l === 'h') autoMap.high = i;
        else if (l === 'low' || l === 'l') autoMap.low = i;
        else if (l === 'close' || l === 'c') autoMap.close = i;
        else if (l.includes('volume') || l === 'vol' || l === 'v') autoMap.volume = i;
      });
      if (autoMap.date === undefined || autoMap.open === undefined || autoMap.close === undefined) {
        throw new Error("Could not detect required columns in saved file");
      }
      const parsedData: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const close = parseFloat(vals[autoMap.close]);
        if (isNaN(close)) continue;
        parsedData.push({
          date: vals[autoMap.date],
          open: parseFloat(vals[autoMap.open]) || 0,
          high: parseFloat(vals[autoMap.high ?? autoMap.open]) || 0,
          low: parseFloat(vals[autoMap.low ?? autoMap.open]) || 0,
          close,
          volume: autoMap.volume !== undefined ? parseFloat(vals[autoMap.volume]) || 0 : 0,
        });
      }
      setCsvData(parsedData);
      setCsvFileName(file.file_name);
      setCsvTimeframe(file.timeframe);
      if (file.date_range_start && file.date_range_end) {
        setCsvDateMin(file.date_range_start);
        setCsvDateMax(file.date_range_end);
        setStartDate(file.date_range_start);
        setEndDate(file.date_range_end);
      }
      toast.success(`Loaded "${file.file_name}" (${parsedData.length} candles)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to load file");
    } finally {
      setLibraryFileLoading(false);
    }
  };

  // Clear results on ANY config change
  useEffect(() => {
    setResults(null);
    setWalkForwardResult(null);
    setUsedFallbackData(false);
  }, [symbol, dataSourceMode, timeframe, startDate, endDate, initialCapital, commissionPercent, slippagePercent, selectedStrategy, stopLossPercent, takeProfitPercent, riskRewardRatio, positionSizing, enableShorts]);

  // NSE India Charts API supports longer intraday ranges than Yahoo
  // 1m data available for ~1 year, 5m/15m for several years

  const runBacktestHandler = async () => {
    if (!user || !selectedStrategy) { toast.error("Please select a strategy"); return; }
    if (!canRunBacktest) { setLimitModalType("backtest"); setShowLimitModal(true); return; }
    if (!isTimeframeAllowed(timeframe)) { setLimitModalType("timeframe"); setShowLimitModal(true); return; }
    if (!startDate || !endDate) { toast.error("Please select date range"); return; }
    const s = new Date(startDate), e = new Date(endDate);
    if (s >= e) { toast.error("Start date must be before end date"); return; }

    if (!usagePro && dataSourceMode === "market") {
      const freeMin = new Date(getFreeStartDate());
      if (s < freeMin) { toast.error("Free plan allows max 3 years of data. Upgrade for full history."); return; }
    }
    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital < 10000) { toast.error("Capital must be at least ₹10,000"); return; }
    const strategy = strategies.find(s => s.id === selectedStrategy);
    if (!strategy) { toast.error("Strategy not found"); return; }

    const entryRules: StrategyRule[] = normalizeAIRules(strategy.rules?.entry || []);
    const exitRules: StrategyRule[] = normalizeAIRules(strategy.rules?.exit || []);

    setRunning(true);
    setResults(null);
    setWalkForwardResult(null);

    try {
      let priceData: OHLCV[];
      if (dataSourceMode === "csv" && csvData) {
        priceData = (csvData as any[]).map((row: any) => ({
          date: row.date || row.Date,
          open: typeof row.open === 'number' ? row.open : parseFloat(row.open || row.Open || 0),
          high: typeof row.high === 'number' ? row.high : parseFloat(row.high || row.High || 0),
          low: typeof row.low === 'number' ? row.low : parseFloat(row.low || row.Low || 0),
          close: typeof row.close === 'number' ? row.close : parseFloat(row.close || row.Close || 0),
          volume: typeof row.volume === 'number' ? row.volume : parseFloat(row.volume || row.Volume || 0),
        })).filter((d: OHLCV) => !isNaN(d.close) && d.close > 0 && !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low));
        if (startDate && endDate) {
          priceData = priceData.filter(d => d.date >= startDate && d.date <= endDate);
        }
      } else {
        // Fetch market data (cache-first via edge function)
        try {
          const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('fetch-market-data', {
            body: { symbol, startDate, endDate, timeframe },
          });
          if (fetchError || !fetchResult?.success || !fetchResult?.data?.length) {
            throw new Error(fetchResult?.error || 'No data returned');
          }
          priceData = fetchResult.data as OHLCV[];
          setUsedFallbackData(false);
          const source = fetchResult.meta?.source === 'cache' ? 'cache' : 'Yahoo Finance';
          toast.info(`Loaded ${priceData.length} candles from ${source}`, { duration: 3000 });
        } catch (fetchErr: any) {
          console.warn('Real data fetch failed, using simulated data:', fetchErr.message);
          priceData = generatePriceData(symbol, startDate, endDate, timeframe);
          setUsedFallbackData(true);
          toast.warning('Could not fetch real market data. Using simulated data as fallback.', { duration: 5000 });
        }
      }
      if (priceData.length < 5) throw new Error("Not enough data points. Please select a longer date range.");

      const commission = parseFloat(commissionPercent) || 0;
      const slippage = parseFloat(slippagePercent) || 0;
      const sl = parseFloat(stopLossPercent) || 3;
      const tp = effectiveTP;
      const backtestResults = executeBacktest(priceData, entryRules, exitRules, capital, {
        commissionPercent: commission,
        slippagePercent: slippage,
        stopLossPercent: sl,
        takeProfitPercent: tp,
        positionSizing: (parseFloat(positionSizing) || 95) / 100,
        allowShorts: enableShorts,
      });

      const { error: insertError } = await supabase.from("backtests").insert([{
        user_id: user.id,
        strategy_id: selectedStrategy,
        symbol: dataSourceMode === "csv" ? (csvFileName || "CSV") : symbol,
        timeframe: dataSourceMode === "csv" && csvTimeframe ? csvTimeframe : timeframe,
        start_date: startDate,
        end_date: endDate,
        initial_capital: capital,
        total_trades: backtestResults.totalTrades,
        winning_trades: backtestResults.winningTrades,
        losing_trades: backtestResults.losingTrades,
        win_rate: backtestResults.winRate,
        net_pnl: backtestResults.netPnl,
        profit_factor: backtestResults.profitFactor,
        max_drawdown: backtestResults.maxDrawdown,
        confidence_score: backtestResults.confidenceScore ?? null,
        results: JSON.parse(JSON.stringify(backtestResults)),
      }]);
      if (insertError) throw insertError;

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("monthly_backtests_used")
        .eq("user_id", user.id)
        .maybeSingle();
      await supabase
        .from("profiles")
        .update({ monthly_backtests_used: (currentProfile?.monthly_backtests_used ?? 0) + 1 })
        .eq("user_id", user.id);

      await refresh();
      setResults(backtestResults);

      if (enableWalkForward && usagePro && priceData.length >= 100) {
        try {
          const wfConfig = getDefaultWalkForwardConfig();
          const wfResult = runWalkForwardValidation(priceData, entryRules, exitRules, capital, wfConfig, { commissionPercent: commission, slippagePercent: slippage });
          setWalkForwardResult(wfResult);
        } catch (wfError: any) {
          console.warn("Walk-forward validation skipped:", wfError.message);
        }
      }

      const skipped = backtestResults.skippedSignals || 0;
      if (backtestResults.totalTrades > 0 && skipped > 0) {
        toast.info(`${skipped} signal(s) skipped due to insufficient capital for position sizing.`, { duration: 5000 });
      }
      toast.success(`Backtest completed! ${backtestResults.totalTrades} trades executed.`);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (error: any) {
      console.error("Backtest error:", error);
      toast.error(error.message || "Failed to run backtest");
    } finally {
      setRunning(false);
    }
  };

  const displaySymbol = dataSourceMode === "csv" ? (csvFileName || "CSV Data") : symbol;
  const activeTimeframe = dataSourceMode === "csv" && csvTimeframe ? csvTimeframe : timeframe;
  const activeDateStart = startDate;
  const activeDateEnd = endDate;

  // Compute data summary for display
  const getDataSummary = () => {
    const ds = dataSourceMode === "csv" ? (csvFileName || "CSV Data") : (ALL_DATASETS.find(d => d.value === symbol)?.label || symbol);
    const tf = TIMEFRAMES.find(t => t.value === activeTimeframe)?.label || activeTimeframe;
    return { dataset: ds, timeframe: tf, start: activeDateStart, end: activeDateEnd };
  };

  // Get readable rules from strategy
  const getReadableRules = (rules: any[] | undefined) => {
    if (!rules || rules.length === 0) return ["No rules defined"];
    return rules.map((r: any) => {
      const ind = typeof r.indicator === 'object' ? JSON.stringify(r.indicator) : (r.indicator || '?');
      const cond = r.condition || '?';
      const val = typeof r.value === 'object' ? JSON.stringify(r.value) : (r.value || '?');
      return `${ind} ${cond} ${val}`;
    });
  };

  const dataSummary = getDataSummary();

  return (
    <AppLayout loading={loading} showBack backTo="/dashboard" title="Run Backtest" subtitle="Test your strategy on historical data">
      {/* Limit banner */}
      {!canRunBacktest && (
        <Card className="border-warning/50 bg-warning/5 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-warning">Monthly backtest limit reached</p>
                <p className="text-sm text-muted-foreground">Upgrade to Pro for unlimited backtests.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6 max-w-3xl mx-auto">
        {/* ===================== STEP 1: SELECT DATA ===================== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">1</div>
                Select Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={dataSourceMode === "market" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setDataSourceMode("market");
                    setCsvData(null); setCsvFileName(null); setCsvTimeframe(null);
                    setCsvDateMin(""); setCsvDateMax(""); setSelectedLibraryFile("");
                    const ds = ALL_DATASETS.find(d => d.value === symbol);
                    const minDate = !usagePro ? getFreeStartDate() : (ds?.availableFrom || "2010-01-01");
                    if (ds) { setStartDate(minDate); setEndDate(YESTERDAY); }
                  }}
                  className="w-full"
                >
                  <Database className="h-4 w-4 mr-1.5" /> Real Market Data
                </Button>
                <Button
                  type="button"
                  variant={dataSourceMode === "csv" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (!usagePro) { toast.error("CSV upload is a Pro feature"); navigate("/upgrade"); return; }
                    setDataSourceMode("csv");
                    setStartDate(""); setEndDate("");
                  }}
                  className="w-full relative"
                >
                  <Upload className="h-4 w-4 mr-1.5" /> Upload CSV
                  {!usagePro && <ProBadge className="absolute -top-2 -right-2" />}
                </Button>
              </div>

              {dataSourceMode === "market" && (
                <>
                  <div className="space-y-2">
                    <Label>Dataset</Label>
                    <Select value={symbol} onValueChange={(val) => {
                      const ds = ALL_DATASETS.find(d => d.value === val);
                      if (!usagePro && ds && !ds.isFree) {
                        toast.error("This dataset is available for Pro users only");
                        return;
                      }
                      setSymbol(val);
                      const minDate = !usagePro ? getFreeStartDate() : (ds?.availableFrom || "2010-01-01");
                      if (ds) { setStartDate(minDate); setEndDate(TODAY); }
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_DATASETS.map(d => {
                          const locked = !usagePro && !d.isFree;
                          return (
                            <SelectItem key={d.value} value={d.value}>
                              <div className="flex items-center gap-2">
                                <span className={locked ? "text-muted-foreground" : ""}>{d.label}</span>
                                {locked && <Lock className="h-3 w-3 text-accent" />}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Timeframe
                      {!usagePro && <span className="text-xs text-muted-foreground ml-1">(Daily only for Free · Max 3 years)</span>}
                    </Label>
                    <Select
                      value={timeframe}
                      onValueChange={(v) => {
                        if (!usagePro && !FREE_TIMEFRAMES.includes(v)) { setLimitModalType("timeframe"); setShowLimitModal(true); return; }
                        setTimeframe(v);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEFRAMES.map(tf => {
                          const isLocked = !usagePro && !FREE_TIMEFRAMES.includes(tf.value);
                          return (
                            <SelectItem key={tf.value} value={tf.value}>
                              <div className="flex items-center gap-2">
                                <span className={isLocked ? "text-muted-foreground" : ""}>{tf.label}</span>
                                {isLocked && <Lock className="h-3 w-3 text-accent" />}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</Label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        min={!usagePro ? getFreeStartDate() : (ALL_DATASETS.find(d => d.value === symbol)?.availableFrom)} max={endDate} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</Label>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} max={TODAY} />
                    </div>
                  </div>
                </>
              )}

              {dataSourceMode === "csv" && (
                <>
                  <CSVUploader
                    onDataLoaded={(data, detectedTf) => { setCsvData(data); if (detectedTf) setCsvTimeframe(detectedTf); }}
                    onDateRangeDetected={(min, max) => { setCsvDateMin(min); setCsvDateMax(max); setStartDate(min); setEndDate(max); }}
                    onClear={() => { setCsvData(null); setCsvFileName(null); setCsvTimeframe(null); setCsvDateMin(""); setCsvDateMax(""); }}
                    isPro={usagePro}
                  />


                  {csvDateMin && csvDateMax && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={csvDateMin} max={endDate || csvDateMax} />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || csvDateMin} max={csvDateMax} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Data Summary Card */}
              {startDate && endDate && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dataset</p>
                      <p className="text-sm font-semibold text-foreground">{dataSummary.dataset}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Timeframe</p>
                      <p className="text-sm font-semibold text-foreground">{dataSummary.timeframe}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
                      <p className="text-sm font-semibold text-foreground">{dataSummary.start}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To</p>
                      <p className="text-sm font-semibold text-foreground">{dataSummary.end}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ===================== STEP 2: SELECT STRATEGY ===================== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">2</div>
                Select Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger><SelectValue placeholder="Select a strategy" /></SelectTrigger>
                <SelectContent>
                  {strategies.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                        <span className="text-xs text-muted-foreground">V{s.current_version}</span>
                        {s.is_ai_generated && <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">AI</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {strategies.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No strategies found.{" "}
                  <button onClick={() => navigate("/strategy-builder")} className="text-accent hover:underline">Create one</button>
                </p>
              )}

              {/* Strategy Preview */}
              {selectedStrategyData && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                  <div>
                    <p className="font-medium text-sm">{selectedStrategyData.name}</p>
                  </div>
                  {selectedStrategyData.description && (
                    <p className="text-xs text-muted-foreground">{selectedStrategyData.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Entry Rules</p>
                      {getReadableRules(selectedStrategyData.rules?.entry).map((r, i) => (
                        <p key={i} className="text-xs text-foreground">• {r}</p>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Exit Rules</p>
                      {getReadableRules(selectedStrategyData.rules?.exit).map((r, i) => (
                        <p key={i} className="text-xs text-foreground">• {r}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ===================== STEP 3: SETTINGS ===================== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">3</div>
                Basic Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Capital */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Initial Capital (₹)
                  <InfoTooltip content="Starting capital. Minimum ₹10,000." />
                </Label>
                <Input type="number" value={initialCapital} onChange={e => { const v = e.target.value; if (v === '' || (Number(v) <= 100000000 && v.length <= 9)) setInitialCapital(v); }} min="10000" max="100000000" step="10000" placeholder="100000" />
                {Number(initialCapital) >= 100000000 && <p className="text-xs text-amber-500">Max ₹10 Crore — higher values produce unrealistic simulation results.</p>}
              </div>

              {/* Commission & Slippage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">Commission (%)<InfoTooltip content="Per-trade commission." /></Label>
                  <Input type="number" value={commissionPercent} onChange={e => { const v = e.target.value; if (v === '' || Number(v) <= 5) setCommissionPercent(v); }} min="0" max="5" step="0.01" placeholder="0.03" />
                  {Number(commissionPercent) >= 5 && <p className="text-xs text-amber-500">Max 5% — realistic brokerage fees rarely exceed this.</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">Slippage (%)<InfoTooltip content="Estimated price slippage." /></Label>
                  <Input type="number" value={slippagePercent} onChange={e => { const v = e.target.value; if (v === '' || Number(v) <= 5) setSlippagePercent(v); }} min="0" max="5" step="0.01" placeholder="0.05" />
                  {Number(slippagePercent) >= 5 && <p className="text-xs text-amber-500">Max 5% — higher slippage makes backtests unreliable.</p>}
                </div>
              </div>

              {/* Position Sizing */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">Position Sizing (% of capital)<InfoTooltip content="Percentage of capital to use per trade." /></Label>
                <Input type="number" value={positionSizing} onChange={e => { const v = e.target.value; if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) setPositionSizing(v); }} min="1" max="100" step="5" placeholder="95" />
                {Number(positionSizing) >= 100 && <p className="text-xs text-amber-500">Max 100% — you can't invest more than your total capital.</p>}
              </div>

              {/* SL / TP / Risk:Reward */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">Stop Loss (%)</Label>
                  <Input type="number" value={stopLossPercent} onChange={e => { const v = e.target.value; if (v === '' || Number(v) <= 50) setStopLossPercent(v); }} min="0.1" max="50" step="0.1" />
                  {Number(stopLossPercent) >= 50 && <p className="text-xs text-amber-500">Max 50% — a larger stop loss defeats risk management.</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">Take Profit (%)</Label>
                  <Input
                    type="number"
                    value={effectiveTP.toFixed(1)}
                    onChange={e => riskRewardRatio === "manual" && setTakeProfitPercent(e.target.value)}
                    readOnly={riskRewardRatio !== "manual"}
                    className={riskRewardRatio !== "manual" ? "bg-muted/50 cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1"><Target className="h-3 w-3" /> Risk : Reward</Label>
                  <Select value={riskRewardRatio} onValueChange={(val) => { setRiskRewardRatio(val); if (val === "manual") setTakeProfitPercent("5"); }}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="1">1 : 1</SelectItem>
                      <SelectItem value="2">1 : 2</SelectItem>
                      <SelectItem value="3">1 : 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enable Shorts */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <Label className="text-sm cursor-pointer">Enable Short Selling</Label>
                <Switch checked={enableShorts} onCheckedChange={setEnableShorts} />
              </div>

              {/* Walk-Forward (Pro) */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Label className="text-sm cursor-pointer">Walk-Forward Validation</Label>
                  {!usagePro && <Crown className="h-3.5 w-3.5 text-accent" />}
                </div>
                <Switch
                  checked={enableWalkForward}
                  onCheckedChange={(checked) => {
                    if (!usagePro) { toast.error("Walk-Forward is a Pro feature"); return; }
                    setEnableWalkForward(checked);
                  }}
                  disabled={!usagePro}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ===================== STEP 4: RUN ===================== */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Disclaimer - only show when API failed and simulated data was used */}
          {usedFallbackData && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 mb-4 text-xs text-destructive">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>⚠️ Real market data could not be fetched. Results below use simulated data and may not reflect actual market conditions.</p>
            </div>
          )}

          <Button
            onClick={runBacktestHandler}
            disabled={running || !selectedStrategy || strategies.length === 0 || !canRunBacktest || (dataSourceMode === "csv" && !csvData) || !startDate || !endDate}
            className="w-full h-14 text-base bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {running ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Running Backtest…</>
            ) : (
              <><Play className="h-5 w-5 mr-2" /> Run Backtest</>
            )}
          </Button>
        </motion.div>

        {/* ===================== RESULTS ===================== */}
        <div ref={resultsRef}>
          <AnimatePresence mode="wait">
            {running && (
              <motion.div key="progress" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <BacktestProgressBar isRunning={running} strategyName={selectedStrategyData?.name} symbol={displaySymbol} />
              </motion.div>
            )}

            {!running && results && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {results.totalTrades === 0 ? (
                  <NoTradesState 
                    onModifyStrategy={() => window.scrollTo({ top: 0, behavior: "smooth" })} 
                    skippedSignals={results.skippedSignals || 0}
                  />
                ) : (
                  <BacktestResults
                    results={results}
                    symbol={displaySymbol}
                    isPro={usagePro}
                    entryRules={selectedStrategyData?.rules?.entry || []}
                    exitRules={selectedStrategyData?.rules?.exit || []}
                    walkForwardResult={walkForwardResult}
                  />
                )}
              </motion.div>
            )}

            {!running && !results && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-border">
                  <CardContent className="py-16 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                    <h3 className="font-heading font-semibold mb-2">Ready to Test</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Configure your data, strategy, and settings above, then click "Run Backtest" to see results.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <LimitReachedModal open={showLimitModal} onOpenChange={setShowLimitModal} limitType={limitModalType} />
    </AppLayout>
  );
};

export default BacktestRunner;
