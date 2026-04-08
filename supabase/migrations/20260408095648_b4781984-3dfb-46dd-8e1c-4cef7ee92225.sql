CREATE POLICY "Admins can insert affiliates"
ON public.affiliates
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));