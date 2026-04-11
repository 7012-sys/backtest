
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow service_role
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow admins
  IF has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Allow the handle_new_user trigger to assign the default 'user' role
  IF TG_OP = 'INSERT' AND NEW.role = 'user' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only administrators can assign user roles.';
END;
$function$;
