
-- =============================================
-- Sprint 1: TradeTest Database Schema Changes
-- =============================================

-- 1. Create event_type enum for experiment history
CREATE TYPE public.feedback_type AS ENUM ('bug', 'feature', 'general');
CREATE TYPE public.feedback_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.experiment_event_type AS ENUM ('strategy_change', 'param_change', 'backtest_run', 'data_change');

-- 2. Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all projects" ON public.projects FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create strategy_versions table
CREATE TABLE public.strategy_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  changelog TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.strategy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own strategy versions" ON public.strategy_versions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.strategies WHERE strategies.id = strategy_versions.strategy_id AND strategies.user_id = auth.uid()));
CREATE POLICY "Users can insert own strategy versions" ON public.strategy_versions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.strategies WHERE strategies.id = strategy_versions.strategy_id AND strategies.user_id = auth.uid()));
CREATE POLICY "Admins can view all strategy versions" ON public.strategy_versions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create data_versions table
CREATE TABLE public.data_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_file_id UUID NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  csv_hash TEXT,
  data_source TEXT,
  exchange_source TEXT,
  version_id TEXT,
  import_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.data_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data versions" ON public.data_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data versions" ON public.data_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all data versions" ON public.data_versions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Create strategy_journals table
CREATE TABLE public.strategy_journals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.strategy_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own journals" ON public.strategy_journals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journals" ON public.strategy_journals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journals" ON public.strategy_journals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journals" ON public.strategy_journals FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all journals" ON public.strategy_journals FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON public.strategy_journals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create experiment_history table
CREATE TABLE public.experiment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type experiment_event_type NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.experiment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own experiment history" ON public.experiment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own experiment history" ON public.experiment_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all experiment history" ON public.experiment_history FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type feedback_type NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  status feedback_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all feedback" ON public.feedback FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Alter existing tables - add project_id and new columns

-- strategies: add project_id, current_version
ALTER TABLE public.strategies ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.strategies ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1;

-- backtests: add project_id, strategy_version_id, confidence_score, soft delete
ALTER TABLE public.backtests ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.backtests ADD COLUMN strategy_version_id UUID REFERENCES public.strategy_versions(id) ON DELETE SET NULL;
ALTER TABLE public.backtests ADD COLUMN confidence_score NUMERIC;
ALTER TABLE public.backtests ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.backtests ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- uploaded_files: add project_id, csv_hash, data_source, exchange_source
ALTER TABLE public.uploaded_files ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.uploaded_files ADD COLUMN csv_hash TEXT;
ALTER TABLE public.uploaded_files ADD COLUMN data_source TEXT;
ALTER TABLE public.uploaded_files ADD COLUMN exchange_source TEXT;

-- profiles: add monthly_backtests_used and monthly_reset_date for monthly tracking
ALTER TABLE public.profiles ADD COLUMN monthly_backtests_used INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN monthly_reset_date DATE NOT NULL DEFAULT CURRENT_DATE;
