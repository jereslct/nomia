import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  supplier_id: string | null;
  brand_id: string | null;
  cost_price: number;
  sell_price: number;
  iva_rate: number;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  cost_currency: string;
  cost_exchange_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
  brand?: { id: string; name: string } | null;
}

interface CreateProductParams {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category_id?: string | null;
  supplier_id?: string | null;
  brand_id?: string | null;
  cost_price: number;
  sell_price: number;
  iva_rate?: number;
  min_stock?: number;
  reorder_point?: number;
  cost_currency?: string;
  cost_exchange_rate?: number | null;
}

export function useProducts() {
  const { organizationId, loading: orgLoading, user } = useOrganizationId();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:product_categories(id, name), supplier:suppliers(id, name), brand:brands(id, name)")
        .eq("organization_id", organizationId)
        .order("name");
      if (error) throw error;
      setProducts((data as unknown as Product[]) || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchProducts();
  }, [orgLoading, organizationId, fetchProducts]);

  const createProduct = useCallback(async (params: CreateProductParams) => {
    if (!organizationId) return { error: "Sin organización" };
    const { error } = await supabase.from("products").insert({
      organization_id: organizationId,
      name: params.name,
      description: params.description || null,
      sku: params.sku || null,
      barcode: params.barcode || null,
      category_id: params.category_id || null,
      supplier_id: params.supplier_id || null,
      brand_id: params.brand_id || null,
      cost_price: params.cost_price,
      sell_price: params.sell_price,
      iva_rate: params.iva_rate ?? 21,
      min_stock: params.min_stock ?? 0,
      reorder_point: params.reorder_point ?? 0,
      cost_currency: params.cost_currency ?? "ARS",
      cost_exchange_rate: params.cost_exchange_rate ?? null,
    });
    if (!error) await fetchProducts();
    return { error: error?.message || null };
  }, [organizationId, fetchProducts]);

  const updateProduct = useCallback(async (id: string, params: Partial<CreateProductParams>) => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) updates[k] = v; });
    const { error } = await supabase.from("products").update(updates).eq("id", id);
    if (!error) await fetchProducts();
    return { error: error?.message || null };
  }, [fetchProducts]);

  const toggleActive = useCallback(async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("products").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) await fetchProducts();
    return { error: error?.message || null };
  }, [fetchProducts]);

  return { products, loading: loading || orgLoading, organizationId, createProduct, updateProduct, toggleActive, refetch: fetchProducts };
}
