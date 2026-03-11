import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface StockMovement {
  id: string;
  organization_id: string;
  product_id: string;
  movement_type: "compra" | "venta" | "ajuste_positivo" | "ajuste_negativo" | "devolucion";
  quantity: number;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface StockAlert {
  id: string;
  product_id: string | null;
  category_id: string | null;
  min_stock_override: number | null;
  is_active: boolean;
}

export interface ProductStock {
  id: string;
  name: string;
  sku: string | null;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  category_id: string | null;
  category?: { name: string } | null;
  status: "ok" | "low" | "critical";
}

export function useInventory() {
  const { organizationId, loading: orgLoading, user } = useOrganizationId();
  const [stockProducts, setStockProducts] = useState<ProductStock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, current_stock, min_stock, reorder_point, category_id, category:product_categories(name)")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (data || []).map((p: any) => ({
        ...p,
        status: p.current_stock <= p.min_stock ? "critical" : p.current_stock <= p.reorder_point ? "low" : "ok",
      }));
      setStockProducts(items as ProductStock[]);
    } catch (err) {
      console.error("Error fetching stock:", err);
      setStockProducts([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  const fetchMovements = useCallback(async (productId?: string) => {
    if (!organizationId) return;
    let query = supabase
      .from("stock_movements")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (productId) query = query.eq("product_id", productId);
    const { data, error } = await query;
    if (!error) setMovements((data as StockMovement[]) || []);
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) {
      fetchStock();
      fetchMovements();
    }
  }, [orgLoading, organizationId, fetchStock, fetchMovements]);

  const createAdjustment = useCallback(async (
    productId: string,
    quantity: number,
    type: "ajuste_positivo" | "ajuste_negativo",
    notes?: string,
  ) => {
    if (!organizationId || !user) return { error: "Sin organización" };
    const { error } = await supabase.from("stock_movements").insert({
      organization_id: organizationId,
      product_id: productId,
      movement_type: type,
      quantity: Math.abs(quantity),
      notes: notes || null,
      created_by: user.id,
    });
    if (!error) {
      await fetchStock();
      await fetchMovements();
    }
    return { error: error?.message || null };
  }, [organizationId, user, fetchStock, fetchMovements]);

  return {
    stockProducts,
    movements,
    loading: loading || orgLoading,
    organizationId,
    createAdjustment,
    fetchMovements,
    refetch: fetchStock,
  };
}
