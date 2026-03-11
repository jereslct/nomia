import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SubscriptionPlan {
  name: string;
  slug: string;
  apps_included: string[];
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [appsIncluded, setAppsIncluded] = useState<string[]>(["nomia"]);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAppsIncluded(["nomia"]);
      setPlan(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const { data: apps, error } = await supabase.rpc(
          "get_org_subscription_apps",
          { _user_id: user.id }
        );

        if (!error && apps) {
          setAppsIncluded(apps as string[]);
        }

        const { data: orgId } = await supabase.rpc(
          "get_user_organization_id",
          { _user_id: user.id }
        );

        if (orgId) {
          const { data: sub } = await supabase
            .from("organization_subscriptions")
            .select("subscription_plans(name, slug, apps_included)")
            .eq("organization_id", orgId)
            .in("status", ["active", "trial"])
            .limit(1)
            .maybeSingle();

          if (sub?.subscription_plans) {
            const p = sub.subscription_plans as unknown as SubscriptionPlan;
            setPlan(p);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const hasApp = useCallback(
    (appSlug: string) => appsIncluded.includes(appSlug),
    [appsIncluded]
  );

  return {
    plan,
    appsIncluded,
    hasApp,
    loading,
  };
};
