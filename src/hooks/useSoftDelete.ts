import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SoftDeleteOptions {
  onDeleted?: () => void;
  undoTimeoutMs?: number;
}

export const useSoftDelete = (options: SoftDeleteOptions = {}) => {
  const { onDeleted, undoTimeoutMs = 5000 } = options;
  const pendingDeletes = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const softDeleteStrategy = useCallback(async (strategyId: string, strategyName: string) => {
    // Immediately hide from UI by marking as deleted in local state
    const toastId = toast("Strategy deleted", {
      description: `"${strategyName}" will be permanently deleted.`,
      action: {
        label: "Undo",
        onClick: () => {
          const timeout = pendingDeletes.current.get(strategyId);
          if (timeout) {
            clearTimeout(timeout);
            pendingDeletes.current.delete(strategyId);
            toast.success(`"${strategyName}" restored`);
            onDeleted?.();
          }
        },
      },
      duration: undoTimeoutMs,
    });

    // Schedule actual deletion
    const timeout = setTimeout(async () => {
      pendingDeletes.current.delete(strategyId);
      const { error } = await supabase
        .from("strategies")
        .delete()
        .eq("id", strategyId);

      if (error) {
        console.error("Failed to delete strategy:", error);
        toast.error("Failed to delete strategy");
      }
      onDeleted?.();
    }, undoTimeoutMs);

    pendingDeletes.current.set(strategyId, timeout);
    onDeleted?.();
  }, [onDeleted, undoTimeoutMs]);

  const softDeleteBacktest = useCallback(async (backtestId: string) => {
    // Mark as soft-deleted in DB
    const toastId = toast("Backtest deleted", {
      description: "This backtest will be permanently removed.",
      action: {
        label: "Undo",
        onClick: async () => {
          const timeout = pendingDeletes.current.get(backtestId);
          if (timeout) {
            clearTimeout(timeout);
            pendingDeletes.current.delete(backtestId);
            toast.success("Backtest restored");
            onDeleted?.();
          }
        },
      },
      duration: undoTimeoutMs,
    });

    const timeout = setTimeout(async () => {
      pendingDeletes.current.delete(backtestId);
      const { error } = await supabase
        .from("backtests")
        .delete()
        .eq("id", backtestId);

      if (error) {
        console.error("Failed to delete backtest:", error);
        toast.error("Failed to delete backtest");
      }
      onDeleted?.();
    }, undoTimeoutMs);

    pendingDeletes.current.set(backtestId, timeout);
    onDeleted?.();
  }, [onDeleted, undoTimeoutMs]);

  const isPendingDelete = useCallback((id: string) => {
    return pendingDeletes.current.has(id);
  }, []);

  return { softDeleteStrategy, softDeleteBacktest, isPendingDelete };
};
