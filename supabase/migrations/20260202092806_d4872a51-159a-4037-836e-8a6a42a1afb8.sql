-- Add usage tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_backtests_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploaded_files_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS strategies_count integer DEFAULT 0;

-- Create uploaded_files table for Data Library
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1d',
  date_range_start DATE,
  date_range_end DATE,
  file_size INTEGER,
  row_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on uploaded_files
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for uploaded_files
CREATE POLICY "Users can view their own uploaded files"
ON public.uploaded_files
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploaded files"
ON public.uploaded_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploaded files"
ON public.uploaded_files
FOR DELETE
USING (auth.uid() = user_id);

-- Function to increment backtest count
CREATE OR REPLACE FUNCTION public.increment_backtest_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET total_backtests_used = COALESCE(total_backtests_used, 0) + 1
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-increment backtest count
DROP TRIGGER IF EXISTS increment_backtest_on_insert ON public.backtests;
CREATE TRIGGER increment_backtest_on_insert
AFTER INSERT ON public.backtests
FOR EACH ROW
EXECUTE FUNCTION public.increment_backtest_count();

-- Function to update strategies count
CREATE OR REPLACE FUNCTION public.update_strategies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET strategies_count = COALESCE(strategies_count, 0) + 1
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET strategies_count = GREATEST(COALESCE(strategies_count, 0) - 1, 0)
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update strategies count
DROP TRIGGER IF EXISTS update_strategies_count_trigger ON public.strategies;
CREATE TRIGGER update_strategies_count_trigger
AFTER INSERT OR DELETE ON public.strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_strategies_count();

-- Function to update uploaded files count
CREATE OR REPLACE FUNCTION public.update_uploaded_files_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET uploaded_files_count = COALESCE(uploaded_files_count, 0) + 1
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET uploaded_files_count = GREATEST(COALESCE(uploaded_files_count, 0) - 1, 0)
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update uploaded files count
DROP TRIGGER IF EXISTS update_uploaded_files_count_trigger ON public.uploaded_files;
CREATE TRIGGER update_uploaded_files_count_trigger
AFTER INSERT OR DELETE ON public.uploaded_files
FOR EACH ROW
EXECUTE FUNCTION public.update_uploaded_files_count();