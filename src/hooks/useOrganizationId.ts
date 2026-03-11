import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useOrganizationId() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganizationId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    if (isAdmin) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      return data?.[0]?.id || null;
    }

    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    return data?.organization_id || null;
  }, [user, isAdmin]);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(authLoading);
      return;
    }
    let cancelled = false;
    fetchOrganizationId().then((id) => {
      if (!cancelled) {
        setOrganizationId(id);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [authLoading, user, fetchOrganizationId]);

  return { organizationId, loading: loading || authLoading, user, isAdmin };
}
