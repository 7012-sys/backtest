import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// FREE plan limits
const FREE_BACKTEST_LIMIT = 30; // 30 backtests for free
const FREE_STRATEGY_LIMIT = 2; // 2 manual strategies
const FREE_FILE_LIMIT = 0; // CSV upload disabled for free
const FREE_AI_LIMIT = 0; // AI disabled for free
const PRO_AI_DAILY_LIMIT = 30; // 30 AI strategies/day for Pro

// FREE preloaded stocks only — only NIFTY50 for free
export const FREE_STOCKS = ["NIFTY50"];

// ALL indicators unlocked for free
export const FREE_INDICATORS = ["PRICE", "SMA", "EMA", "RSI", "VOLUME", "MACD", "BB", "STOCHASTIC", "ADX", "ATR", "PARABOLIC_SAR", "OBV", "VWAP", "CCI", "MFI"];
export const PRO_INDICATORS: string[] = [];

// FREE timeframes only
export const FREE_TIMEFRAMES = ["1d"];
export const PRO_TIMEFRAMES = ["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"];

interface UsageLimits {
  // Backtest limits (monthly)
  monthlyBacktestsUsed: number;
  backtestLimit: number | null; // null = unlimited
  canRunBacktest: boolean;
  
  // AI limits
  aiStrategiesUsed: number;
  aiStrategyLimit: number | null;
  canUseAI: boolean;
  aiDailyUsed: number;
  
  // Strategy limits
  strategiesCount: number;
  strategyLimit: number | null;
  canCreateStrategy: boolean;
  
  // File upload limits
  uploadedFilesCount: number;
  fileLimit: number | null;
  canUploadFile: boolean;
  
  // Subscription info
  isLoading: boolean;
  isPro: boolean;
  isAdmin: boolean;
  expiryDate: Date | null;
  isExpired: boolean;
  
  // Stock access
  isStockAllowed: (stock: string) => boolean;
  
  // Indicator access
  isIndicatorAllowed: (indicator: string) => boolean;
  isTimeframeAllowed: (timeframe: string) => boolean;
  
  // Legacy compat
  totalBacktestsUsed: number;
  
  refresh: () => Promise<void>;
}

export const useUsageLimits = (userId: string | undefined): UsageLimits => {
  const [monthlyBacktestsUsed, setMonthlyBacktestsUsed] = useState(0);
  const [totalBacktestsUsed, setTotalBacktestsUsed] = useState(0);
  const [aiStrategiesUsed, setAIStrategiesUsed] = useState(0);
  const [aiDailyUsed, setAiDailyUsed] = useState(0);
  const [strategiesCount, setStrategiesCount] = useState(0);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Check subscription status
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      if (!subError && subscription) {
        const isProPlan = subscription.plan === "pro" && subscription.status === "active";
        const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
        const expired = periodEnd ? periodEnd < new Date() : false;
        
        if (isProPlan && expired) {
          setIsPro(false);
          setIsExpired(true);
          await supabase
            .from("subscriptions")
            .update({ plan: "free", status: "expired" })
            .eq("user_id", userId);
        } else {
          setIsPro(isProPlan);
          setIsExpired(false);
        }
        
        setExpiryDate(periodEnd);
      }

      // Fetch profile with usage counts
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("total_backtests_used, uploaded_files_count, strategies_count, monthly_backtests_used, monthly_reset_date")
        .eq("user_id", userId)
        .maybeSingle();

      if (!profileError && profile) {
        setTotalBacktestsUsed(profile.total_backtests_used || 0);
        setUploadedFilesCount(profile.uploaded_files_count || 0);
        setStrategiesCount(profile.strategies_count || 0);
        
        // Check if monthly reset is needed
        const resetDate = profile.monthly_reset_date ? new Date(profile.monthly_reset_date) : new Date();
        const now = new Date();
        const needsReset = resetDate.getFullYear() !== now.getFullYear() || resetDate.getMonth() !== now.getMonth();
        
        if (needsReset) {
          // Reset monthly counter
          await supabase
            .from("profiles")
            .update({ monthly_backtests_used: 0, monthly_reset_date: now.toISOString().split('T')[0] })
            .eq("user_id", userId);
          setMonthlyBacktestsUsed(0);
        } else {
          setMonthlyBacktestsUsed(profile.monthly_backtests_used || 0);
        }
      }

      // Fetch total AI strategies used
      const { count: aiCount, error: aiError } = await supabase
        .from("strategies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_ai_generated", true);

      if (!aiError) {
        setAIStrategiesUsed(aiCount || 0);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const effectivePro = isPro && !isExpired;

  const isIndicatorAllowed = (indicator: string): boolean => {
    if (effectivePro) return true;
    const base = indicator.toUpperCase().replace(/_(UPPER|LOWER|MIDDLE|SIGNAL|\d+)/g, '').replace(/_$/, '');
    return FREE_INDICATORS.includes(base);
  };

  const isTimeframeAllowed = (timeframe: string): boolean => {
    if (effectivePro) return true;
    return FREE_TIMEFRAMES.includes(timeframe);
  };

  const isStockAllowed = (stock: string): boolean => {
    if (effectivePro) return true;
    return FREE_STOCKS.includes(stock.toUpperCase());
  };

  return {
    // Backtest limits (monthly)
    monthlyBacktestsUsed,
    backtestLimit: effectivePro ? null : FREE_BACKTEST_LIMIT,
    canRunBacktest: effectivePro || monthlyBacktestsUsed < FREE_BACKTEST_LIMIT,
    
    // AI limits
    aiStrategiesUsed,
    aiStrategyLimit: effectivePro ? null : FREE_AI_LIMIT,
    canUseAI: effectivePro,
    
    // Strategy limits
    strategiesCount,
    strategyLimit: effectivePro ? null : FREE_STRATEGY_LIMIT,
    canCreateStrategy: effectivePro || strategiesCount < FREE_STRATEGY_LIMIT,
    
    // File limits
    uploadedFilesCount,
    fileLimit: effectivePro ? null : FREE_FILE_LIMIT,
    canUploadFile: effectivePro,
    
    // Subscription info
    isLoading,
    isPro: effectivePro,
    expiryDate,
    isExpired,
    
    // Stock access
    isStockAllowed,
    
    // Indicator/timeframe checks
    isIndicatorAllowed,
    isTimeframeAllowed,
    
    // Legacy compat
    totalBacktestsUsed,
    
    refresh: fetchUsage,
  };
};
