import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface Sale {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  seller_id: string | null;
  location_id: string | null;
  pos_id: string | null;
  customer_id: string | null;
  sale_channel: "local_fisico" | "catalogo" | "online";
  date: string;
  subtotal: number;
  iva_amount: number;
  total: number;
  payment_method: "efectivo" | "tarjeta" | "transferencia" | "otro";
  payment_status: "pending" | "partial" | "paid" | "overdue";
  is_formal: boolean;
  notes: string | null;
  created_at: string;
  items?: SaleItem[];
  seller?: { full_name: string } | null;
  customer?: { name: string } | null;
}

export interface SaleItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  cost_price_snapshot: number;
  subtotal: number;
  product_name?: string;
  iva_rate?: number;
}

export interface CreateSaleParams {
  sale_channel: "local_fisico" | "catalogo" | "online";
  payment_method: "efectivo" | "tarjeta" | "transferencia" | "otro";
  payment_status?: "pending" | "partial" | "paid" | "overdue";
  is_formal: boolean;
  invoice_type?: string;
  customer_id?: string | null;
  pos_id?: string | null;
  seller_id?: string | null;
  location_id?: string | null;
  notes?: string;
  items: SaleItem[];
  subtotal: number;
  iva_amount: number;
  total: number;
}

export function useSales() {
  const { organizationId, loading: orgLoading, user } = useOrganizationId();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async (dateFrom?: string, dateTo?: string) => {
    if (!organizationId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("sales")
        .select("*")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false })
        .limit(500);
      if (dateFrom) query = query.gte("date", dateFrom);
      if (dateTo) query = query.lte("date", dateTo);
      const { data, error } = await query;
      if (error) throw error;
      setSales((data as unknown as Sale[]) || []);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchSales();
  }, [orgLoading, organizationId, fetchSales]);

  const createSale = useCallback(async (params: CreateSaleParams) => {
    if (!organizationId || !user) return { error: "Sin organización" };

    let invoiceId: string | null = null;
    if (params.is_formal && params.invoice_type) {
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          organization_id: organizationId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          invoice_type: params.invoice_type as any,
          direction: "emitida" as const,
          date: new Date().toISOString().split("T")[0],
          client_name: null,
          subtotal: params.subtotal,
          iva_amount: params.iva_amount,
          total: params.total,
          status: "confirmed" as const,
          created_by: user.id,
          customer_id: params.customer_id || null,
        })
        .select("id")
        .single();
      if (invErr) return { error: invErr.message };
      invoiceId = inv?.id || null;
    }

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({
        organization_id: organizationId,
        invoice_id: invoiceId,
        seller_id: params.seller_id || user.id,
        location_id: params.location_id || null,
        pos_id: params.pos_id || null,
        customer_id: params.customer_id || null,
        sale_channel: params.sale_channel,
        date: new Date().toISOString().split("T")[0],
        subtotal: params.subtotal,
        iva_amount: params.iva_amount,
        total: params.total,
        payment_method: params.payment_method,
        payment_status: params.payment_status || "paid",
        is_formal: params.is_formal,
        notes: params.notes || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select("id")
      .single();
    if (saleErr) return { error: saleErr.message };
    if (!sale) return { error: "Error creando venta" };

    const saleItems = params.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price_snapshot: item.cost_price_snapshot,
      subtotal: item.subtotal,
    }));
    const { error: itemsErr } = await supabase.from("sale_items").insert(saleItems);
    if (itemsErr) return { error: itemsErr.message };

    for (const item of params.items) {
      await supabase.from("stock_movements").insert({
        organization_id: organizationId,
        product_id: item.product_id,
        movement_type: "venta" as const,
        quantity: item.quantity,
        reference_id: sale.id,
        created_by: user.id,
      });
    }

    await fetchSales();
    return { error: null, saleId: sale.id };
  }, [organizationId, user, fetchSales]);

  return { sales, loading: loading || orgLoading, organizationId, createSale, refetch: fetchSales };
}
