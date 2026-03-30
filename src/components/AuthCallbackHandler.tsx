import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global handler for email verification callbacks.
 * When Supabase redirects back with #access_token in the URL hash,
 * this component detects the new session and redirects to /dashboard.
 */
export const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only process if there's a hash with access_token (email verification callback)
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;

    // Supabase client auto-detects the hash and establishes the session.
    // We just need to wait for it and redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        // Clear the hash from the URL
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  return null;
};
