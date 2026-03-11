import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface Purchase {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  supplier_id: string | null;
  date: string;
  subtotal: number;
  iva_amount: number;
  total: number;
  is_formal: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  supplier?: { name: string } | null;
}

export interface PurchaseItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product_name?: string;
}

export interface CreatePurchaseParams {
  supplier_id: string | null;
  is_formal: boolean;
  invoice_type?: string;
  notes?: string;
  items: PurchaseItem[];
  subtotal: number;
  iva_amount: number;
  total: number;
}

export function usePurchases() {
  const { organizationId, loading: orgLoading, user } = useOrganizationId();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async (dateFrom?: string, dateTo?: string) => {
    if (!organizationId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("purchases")
        .select("*, supplier:suppliers(name)")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false })
        .limit(500);
      if (dateFrom) query = query.gte("date", dateFrom);
      if (dateTo) query = query.lte("date", dateTo);
      const { data, error } = await query;
      if (error) throw error;
      setPurchases((data as unknown as Purchase[]) || []);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchPurchases();
  }, [orgLoading, organizationId, fetchPurchases]);

  const createPurchase = useCallback(async (params: CreatePurchaseParams) => {
    if (!organizationId || !user) return { error: "Sin organización" };

    let invoiceId: string | null = null;
    if (params.is_formal && params.invoice_type) {
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          organization_id: organizationId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          invoice_type: params.invoice_type as any,
          direction: "recibida" as const,
          date: new Date().toISOString().split("T")[0],
          subtotal: params.subtotal,
          iva_amount: params.iva_amount,
          total: params.total,
          status: "confirmed" as const,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (invErr) return { error: invErr.message };
      invoiceId = inv?.id || null;
    }

    const { data: purchase, error: purchaseErr } = await supabase
      .from("purchases")
      .insert({
        organization_id: organizationId,
        invoice_id: invoiceId,
        supplier_id: params.supplier_id,
        date: new Date().toISOString().split("T")[0],
        subtotal: params.subtotal,
        iva_amount: params.iva_amount,
        total: params.total,
        is_formal: params.is_formal,
        notes: params.notes || null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (purchaseErr) return { error: purchaseErr.message };
    if (!purchase) return { error: "Error creando compra" };

    const purchaseItems = params.items.map((item) => ({
      purchase_id: purchase.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));
    await supabase.from("purchase_items").insert(purchaseItems);

    for (const item of params.items) {
      await supabase.from("stock_movements").insert({
        organization_id: organizationId,
        product_id: item.product_id,
        movement_type: "compra" as const,
        quantity: item.quantity,
        reference_id: purchase.id,
        created_by: user.id,
      });
    }

    await fetchPurchases();
    return { error: null, purchaseId: purchase.id };
  }, [organizationId, user, fetchPurchases]);

  return { purchases, loading: loading || orgLoading, organizationId, createPurchase, refetch: fetchPurchases };
}
