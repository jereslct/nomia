import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface PointOfSale {
  id: string;
  organization_id: string;
  name: string;
  location_id: string | null;
  is_active: boolean;
  created_at: string;
}

export function usePointsOfSale() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPOS = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("points_of_sale")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setPointsOfSale((data as unknown as PointOfSale[]) || []);
    } catch (err) {
      console.error("Error fetching POS:", err);
      setPointsOfSale([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchPOS();
  }, [orgLoading, organizationId, fetchPOS]);

  const createPOS = useCallback(async (name: string, location_id?: string | null) => {
    if (!organizationId) return { error: "Sin organización" };
    const { error } = await supabase.from("points_of_sale").insert({
      organization_id: organizationId, name, location_id: location_id || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (!error) await fetchPOS();
    return { error: error?.message || null };
  }, [organizationId, fetchPOS]);

  const updatePOS = useCallback(async (id: string, name: string, location_id?: string | null) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("points_of_sale").update({ name, location_id: location_id || null } as any).eq("id", id);
    if (!error) await fetchPOS();
    return { error: error?.message || null };
  }, [fetchPOS]);

  const deletePOS = useCallback(async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("points_of_sale").update({ is_active: false } as any).eq("id", id);
    if (!error) await fetchPOS();
    return { error: error?.message || null };
  }, [fetchPOS]);

  return { pointsOfSale, loading: loading || orgLoading, organizationId, createPOS, updatePOS, deletePOS, refetch: fetchPOS };
}
