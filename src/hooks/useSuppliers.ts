import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  cuit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateSupplierParams {
  name: string;
  cuit?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export function useSuppliers() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchSuppliers();
  }, [orgLoading, organizationId, fetchSuppliers]);

  const createSupplier = useCallback(async (params: CreateSupplierParams) => {
    if (!organizationId) return { error: "Sin organización" };
    const { error } = await supabase.from("suppliers").insert({
      organization_id: organizationId,
      name: params.name,
      cuit: params.cuit || null,
      phone: params.phone || null,
      email: params.email || null,
      address: params.address || null,
      notes: params.notes || null,
    });
    if (!error) await fetchSuppliers();
    return { error: error?.message || null };
  }, [organizationId, fetchSuppliers]);

  const updateSupplier = useCallback(async (id: string, params: Partial<CreateSupplierParams>) => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) updates[k] = v; });
    const { error } = await supabase.from("suppliers").update(updates).eq("id", id);
    if (!error) await fetchSuppliers();
    return { error: error?.message || null };
  }, [fetchSuppliers]);

  const deleteSupplier = useCallback(async (id: string) => {
    const { error } = await supabase.from("suppliers").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) await fetchSuppliers();
    return { error: error?.message || null };
  }, [fetchSuppliers]);

  return { suppliers, loading: loading || orgLoading, organizationId, createSupplier, updateSupplier, deleteSupplier, refetch: fetchSuppliers };
}
