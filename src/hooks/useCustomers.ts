import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export type TaxCondition = "responsable_inscripto" | "monotributista" | "consumidor_final" | "exento";

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  cuit: string | null;
  tax_condition: TaxCondition;
  phone: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

interface CreateCustomerParams {
  name: string;
  cuit?: string;
  tax_condition?: TaxCondition;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit?: number;
}

export function useCustomers() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setCustomers((data as unknown as Customer[]) || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchCustomers();
  }, [orgLoading, organizationId, fetchCustomers]);

  const createCustomer = useCallback(async (params: CreateCustomerParams) => {
    if (!organizationId) return { error: "Sin organización" };
    const { error } = await supabase.from("customers").insert({
      organization_id: organizationId,
      name: params.name,
      cuit: params.cuit || null,
      tax_condition: params.tax_condition || "consumidor_final",
      phone: params.phone || null,
      email: params.email || null,
      address: params.address || null,
      credit_limit: params.credit_limit ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (!error) await fetchCustomers();
    return { error: error?.message || null };
  }, [organizationId, fetchCustomers]);

  const updateCustomer = useCallback(async (id: string, params: Partial<CreateCustomerParams>) => {
    const updates: Record<string, unknown> = {};
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) updates[k] = v; });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("customers").update(updates as any).eq("id", id);
    if (!error) await fetchCustomers();
    return { error: error?.message || null };
  }, [fetchCustomers]);

  const deleteCustomer = useCallback(async (id: string) => {
    const { error } = await supabase.from("customers").update({ is_active: false }).eq("id", id);
    if (!error) await fetchCustomers();
    return { error: error?.message || null };
  }, [fetchCustomers]);

  return { customers, loading: loading || orgLoading, organizationId, createCustomer, updateCustomer, deleteCustomer, refetch: fetchCustomers };
}
