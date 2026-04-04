import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  isPro: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  expiryDate: Date | null;
  isExpired: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isPro: false,
  isAdmin: false,
  isLoading: true,
  expiryDate: null,
  isExpired: false,
  signOut: async () => {},
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const CACHE_KEY = "auth_sub_cache";

interface CachedSub {
  isPro: boolean;
  isAdmin: boolean;
  expiryDate: string | null;
  isExpired: boolean;
  ts: number;
}

const getCached = (): CachedSub | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSub;
    // Cache valid for 5 minutes
    if (Date.now() - parsed.ts > 5 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
};

const setCache = (data: Omit<CachedSub, "ts">) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
  } catch {}
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const cached = getCached();
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(cached?.isPro ?? false);
  const [isAdmin, setIsAdmin] = useState(cached?.isAdmin ?? false);
  const [expiryDate, setExpiryDate] = useState<Date | null>(
    cached?.expiryDate ? new Date(cached.expiryDate) : null
  );
  const [isExpired, setIsExpired] = useState(cached?.isExpired ?? false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptionData = useCallback(async (userId: string) => {
    try {
      const [subResult, roleResult] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("plan, status, current_period_end")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle(),
      ]);

      const sub = subResult.data;
      const admin = !!roleResult.data;

      let pro = false;
      let expired = false;
      let expiry: Date | null = null;

      if (sub) {
        const isProPlan = sub.plan === "pro" && sub.status === "active";
        expiry = sub.current_period_end ? new Date(sub.current_period_end) : null;
        expired = expiry ? expiry < new Date() : false;

        if (isProPlan && expired) {
          pro = false;
          expired = true;
          // Auto-downgrade
          await supabase
            .from("subscriptions")
            .update({ plan: "free", status: "expired" })
            .eq("user_id", userId);
        } else {
          pro = isProPlan;
        }
      }

      setIsPro(pro);
      setIsAdmin(admin);
      setExpiryDate(expiry);
      setIsExpired(expired);

      setCache({
        isPro: pro,
        isAdmin: admin,
        expiryDate: expiry?.toISOString() ?? null,
        isExpired: expired,
      });
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchSubscriptionData(session.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            // Fire-and-forget to avoid deadlock — never await supabase calls inside onAuthStateChange
            fetchSubscriptionData(session.user.id).finally(() => {
              if (mounted) setIsLoading(false);
            });
            return;
          }
        } else {
          setIsPro(false);
          setIsAdmin(false);
          setExpiryDate(null);
          setIsExpired(false);
          sessionStorage.removeItem(CACHE_KEY);
        }
        if (mounted) setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      authSub.unsubscribe();
    };
  }, [fetchSubscriptionData]);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(CACHE_KEY);
    await supabase.auth.signOut({ scope: "local" });
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (user) {
      await fetchSubscriptionData(user.id);
    }
  }, [user, fetchSubscriptionData]);

  return (
    <AuthContext.Provider
      value={{ user, isPro, isAdmin, isLoading, expiryDate, isExpired, signOut, refreshSubscription }}
    >
      {children}
    </AuthContext.Provider>
  );
};
