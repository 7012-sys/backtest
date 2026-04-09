
CREATE TABLE public.affiliate_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert notifications"
ON public.affiliate_notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all notifications"
ON public.affiliate_notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own notifications"
ON public.affiliate_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.affiliate_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
