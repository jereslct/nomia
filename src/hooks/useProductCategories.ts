import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface ProductCategory {
  id: string;
  organization_id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export function useProductCategories() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchCategories();
  }, [orgLoading, organizationId, fetchCategories]);

  const createCategory = useCallback(async (name: string, parent_id?: string | null) => {
    if (!organizationId) return { error: "Sin organización" };
    const { error } = await supabase.from("product_categories").insert({
      organization_id: organizationId, name, parent_id: parent_id || null,
    });
    if (!error) await fetchCategories();
    return { error: error?.message || null };
  }, [organizationId, fetchCategories]);

  const updateCategory = useCallback(async (id: string, name: string, parent_id?: string | null) => {
    const { error } = await supabase.from("product_categories").update({ name, parent_id: parent_id === undefined ? undefined : (parent_id || null) }).eq("id", id);
    if (!error) await fetchCategories();
    return { error: error?.message || null };
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from("product_categories").update({ is_active: false }).eq("id", id);
    if (!error) await fetchCategories();
    return { error: error?.message || null };
  }, [fetchCategories]);

  return { categories, loading: loading || orgLoading, createCategory, updateCategory, deleteCategory, refetch: fetchCategories };
}
