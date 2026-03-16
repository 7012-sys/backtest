
-- Add DELETE RLS policies for account deletion flow

-- data_versions: allow users to delete own records
CREATE POLICY "Users can delete own data versions"
ON public.data_versions
FOR DELETE
USING (auth.uid() = user_id);

-- feedback: allow users to delete own records
CREATE POLICY "Users can delete own feedback"
ON public.feedback
FOR DELETE
USING (auth.uid() = user_id);

-- user_consents: allow users to delete own records
CREATE POLICY "Users can delete own consents"
ON public.user_consents
FOR DELETE
USING (auth.uid() = user_id);

-- subscriptions: allow users to delete own subscription
CREATE POLICY "Users can delete own subscription"
ON public.subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- profiles: allow users to delete own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- strategy_health: allow users to delete own records
CREATE POLICY "Users can delete own strategy health"
ON public.strategy_health
FOR DELETE
USING (auth.uid() = user_id);

-- user_roles: allow users to delete own roles
CREATE POLICY "Users can delete own roles"
ON public.user_roles
FOR DELETE
USING (auth.uid() = user_id);

-- experiment_history: allow users to delete own records
CREATE POLICY "Users can delete own experiment history"
ON public.experiment_history
FOR DELETE
USING (auth.uid() = user_id);
