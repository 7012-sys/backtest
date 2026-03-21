
-- Create strategy_likes table
CREATE TABLE public.strategy_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid NOT NULL REFERENCES public.community_strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(strategy_id, user_id)
);

-- Enable RLS
ALTER TABLE public.strategy_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see like counts
CREATE POLICY "Anyone can view strategy likes"
  ON public.strategy_likes FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Users can insert own likes"
  ON public.strategy_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete (unlike) their own likes
CREATE POLICY "Users can delete own likes"
  ON public.strategy_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
