import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function useBrands() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchBrands();
  }, [orgLoading, organizationId, fetchBrands]);

  const createBrand = useCallback(async (name: string) => {
    if (!organizationId) return { error: "Sin organización" };
    const { error } = await supabase.from("brands").insert({ organization_id: organizationId, name });
    if (!error) await fetchBrands();
    return { error: error?.message || null };
  }, [organizationId, fetchBrands]);

  const updateBrand = useCallback(async (id: string, name: string) => {
    const { error } = await supabase.from("brands").update({ name }).eq("id", id);
    if (!error) await fetchBrands();
    return { error: error?.message || null };
  }, [fetchBrands]);

  const deleteBrand = useCallback(async (id: string) => {
    const { error } = await supabase.from("brands").update({ is_active: false }).eq("id", id);
    if (!error) await fetchBrands();
    return { error: error?.message || null };
  }, [fetchBrands]);

  return { brands, loading: loading || orgLoading, createBrand, updateBrand, deleteBrand, refetch: fetchBrands };
}
