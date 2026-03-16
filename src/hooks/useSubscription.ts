import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string | null;
}

interface UseSubscriptionResult {
  isPro: boolean;
  isLoading: boolean;
  subscription: Subscription | null;
  expiryDate: Date | null;
  isExpired: boolean;
  daysRemaining: number | null;
}

export const useSubscription = (userId: string | undefined): UseSubscriptionResult => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("plan, status, current_period_end")
          .eq("user_id", userId)
          .single();

        if (!error && data) {
          setSubscription(data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [userId]);

  const expiryDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end) 
    : null;
  
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  
  const isPro = subscription?.plan === "pro" && 
                subscription?.status === "active" && 
                !isExpired;

  const daysRemaining = expiryDate && !isExpired
    ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return { isPro, isLoading, subscription, expiryDate, isExpired, daysRemaining };
};
