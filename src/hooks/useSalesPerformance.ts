import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface SellerPerformance {
  seller_id: string;
  seller_name: string;
  total_sales: number;
  total_amount: number;
  avg_ticket: number;
}

export interface CategoryMix {
  category_name: string;
  quantity: number;
  amount: number;
}

export function useSalesPerformance() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [sellers, setSellers] = useState<SellerPerformance[]>([]);
  const [categoryMix, setCategoryMix] = useState<CategoryMix[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPerformance = useCallback(async (dateFrom: string, dateTo: string) => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data: salesData } = await supabase
        .from("sales")
        .select("id, seller_id, total")
        .eq("organization_id", organizationId)
        .gte("date", dateFrom)
        .lte("date", dateTo);

      if (!salesData) { setSellers([]); return; }

      const sellerMap = new Map<string, { total_sales: number; total_amount: number }>();
      for (const s of salesData) {
        if (!s.seller_id) continue;
        const existing = sellerMap.get(s.seller_id) || { total_sales: 0, total_amount: 0 };
        existing.total_sales += 1;
        existing.total_amount += Number(s.total);
        sellerMap.set(s.seller_id, existing);
      }

      const sellerIds = Array.from(sellerMap.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", sellerIds.length > 0 ? sellerIds : ["__none__"]);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
      const result: SellerPerformance[] = sellerIds.map((sid) => {
        const d = sellerMap.get(sid)!;
        return {
          seller_id: sid,
          seller_name: profileMap.get(sid) || "Desconocido",
          total_sales: d.total_sales,
          total_amount: d.total_amount,
          avg_ticket: d.total_sales > 0 ? d.total_amount / d.total_sales : 0,
        };
      }).sort((a, b) => b.total_amount - a.total_amount);

      setSellers(result);

      const saleIds = salesData.map((s) => s.id);
      if (saleIds.length > 0) {
        const { data: items } = await supabase
          .from("sale_items")
          .select("product_id, quantity, subtotal")
          .in("sale_id", saleIds);

        if (items) {
          const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))] as string[];
          const { data: products } = await supabase
            .from("products")
            .select("id, category_id, category:product_categories(name)")
            .in("id", productIds.length > 0 ? productIds : ["__none__"]);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const catMap = new Map((products || []).map((p: any) => [p.id, p.category?.name || "Sin categoría"]));
          const mixMap = new Map<string, { quantity: number; amount: number }>();
          for (const item of items) {
            const catName = catMap.get(item.product_id!) || "Sin categoría";
            const existing = mixMap.get(catName) || { quantity: 0, amount: 0 };
            existing.quantity += Number(item.quantity);
            existing.amount += Number(item.subtotal);
            mixMap.set(catName, existing);
          }
          setCategoryMix(Array.from(mixMap.entries()).map(([name, d]) => ({
            category_name: name, quantity: d.quantity, amount: d.amount,
          })).sort((a, b) => b.amount - a.amount));
        }
      }
    } catch (err) {
      console.error("Error fetching performance:", err);
      setSellers([]);
      setCategoryMix([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  return { sellers, categoryMix, loading: loading || orgLoading, organizationId, fetchPerformance };
}
