import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // The hash fragment contains access_token, refresh_token etc.
        // supabase-js auto-detects and sets the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth", { replace: true });
          return;
        }

        if (session?.user) {
          navigate("/dashboard", { replace: true });
        } else {
          // No session yet — wait for onAuthStateChange to pick it up
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
              subscription.unsubscribe();
              navigate("/dashboard", { replace: true });
            }
          });

          // Timeout fallback — if nothing happens in 5s, go to auth
          setTimeout(() => {
            subscription.unsubscribe();
            navigate("/auth", { replace: true });
          }, 5000);
        }
      } catch (err) {
        console.error("Auth callback exception:", err);
        navigate("/auth", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
