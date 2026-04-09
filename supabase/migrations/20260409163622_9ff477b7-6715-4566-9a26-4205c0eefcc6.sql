
-- 1. Remove affiliates and commissions from Realtime
DO $$
BEGIN
  -- Try to remove affiliates from realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.affiliates;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- table might not be in publication
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.commissions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

-- 2. Prevent privilege escalation on user_roles via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only administrators can assign user roles.';
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.user_roles;
CREATE TRIGGER prevent_role_escalation
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_escalation();
