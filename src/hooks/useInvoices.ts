import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_type: string;
  direction: "emitida" | "recibida";
  number: string | null;
  date: string;
  client_name: string | null;
  client_cuit: string | null;
  client_tax_condition: string | null;
  customer_id: string | null;
  subtotal: number;
  iva_amount: number;
  total: number;
  status: "draft" | "confirmed" | "cancelled" | "afip_sent";
  afip_cae: string | null;
  afip_vencimiento_cae: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  iva_rate: number;
  iva_amount: number;
  subtotal: number;
}

export function useInvoices() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async (filters?: {
    direction?: "emitida" | "recibida";
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    invoiceType?: string;
  }) => {
    if (!organizationId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false })
        .limit(500);
      if (filters?.direction) query = query.eq("direction", filters.direction);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.dateFrom) query = query.gte("date", filters.dateFrom);
      if (filters?.dateTo) query = query.lte("date", filters.dateTo);
      if (filters?.invoiceType) query = query.eq("invoice_type", filters.invoiceType);
      const { data, error } = await query;
      if (error) throw error;
      setInvoices((data as unknown as Invoice[]) || []);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchInvoices();
  }, [orgLoading, organizationId, fetchInvoices]);

  const fetchInvoiceItems = useCallback(async (invoiceId: string): Promise<InvoiceItem[]> => {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);
    if (error) return [];
    return (data as unknown as InvoiceItem[]) || [];
  }, []);

  const cancelInvoice = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "cancelled" as const })
      .eq("id", id);
    if (!error) await fetchInvoices();
    return { error: error?.message || null };
  }, [fetchInvoices]);

  return { invoices, loading: loading || orgLoading, organizationId, fetchInvoices, fetchInvoiceItems, cancelInvoice, refetch: fetchInvoices };
}
