
CREATE POLICY "Users can insert trades for own backtests"
ON public.trades FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.backtests
    WHERE backtests.id = trades.backtest_id
    AND backtests.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete trades from own backtests"
ON public.trades FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.backtests
    WHERE backtests.id = trades.backtest_id
    AND backtests.user_id = auth.uid()
  )
);
