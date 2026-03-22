CREATE POLICY "Admins can delete any community strategy"
ON public.community_strategies
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));