import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface Payment {
  id: string;
  organization_id: string;
  sale_id: string | null;
  customer_id: string | null;
  amount: number;
  payment_method: "efectivo" | "tarjeta" | "transferencia" | "otro";
  reference: string | null;
  date: string;
  created_by: string | null;
  created_at: string;
}

export function usePayments() {
  const { organizationId, loading: orgLoading, user } = useOrganizationId();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false })
        .limit(500);
      if (error) throw error;
      setPayments((data as unknown as Payment[]) || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchPayments();
  }, [orgLoading, organizationId, fetchPayments]);

  const createPayment = useCallback(async (params: {
    sale_id?: string;
    customer_id?: string;
    amount: number;
    payment_method: "efectivo" | "tarjeta" | "transferencia" | "otro";
    reference?: string;
  }) => {
    if (!organizationId || !user) return { error: "Sin organización" };
    const { error } = await supabase.from("payments").insert({
      organization_id: organizationId,
      sale_id: params.sale_id || null,
      customer_id: params.customer_id || null,
      amount: params.amount,
      payment_method: params.payment_method,
      reference: params.reference || null,
      created_by: user.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (!error) await fetchPayments();
    return { error: error?.message || null };
  }, [organizationId, user, fetchPayments]);

  return { payments, loading: loading || orgLoading, organizationId, createPayment, refetch: fetchPayments };
}
