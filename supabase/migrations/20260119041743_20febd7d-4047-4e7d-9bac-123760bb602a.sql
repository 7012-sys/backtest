-- Allow users to delete their own backtests
CREATE POLICY "Users can delete own backtests" 
ON public.backtests 
FOR DELETE 
USING (auth.uid() = user_id);