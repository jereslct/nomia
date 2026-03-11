import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface IvaSummary {
  iva_debito: number;
  iva_credito: number;
  iva_a_pagar: number;
}

export function useIvaReport() {
  const { organizationId, loading: orgLoading } = useOrganizationId();
  const [summary, setSummary] = useState<IvaSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIvaSummary = useCallback(async (periodStart: string, periodEnd: string) => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_iva_summary", {
        _org_id: organizationId,
        _period_start: periodStart,
        _period_end: periodEnd,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setSummary(row ? { iva_debito: Number(row.iva_debito), iva_credito: Number(row.iva_credito), iva_a_pagar: Number(row.iva_a_pagar) } : null);
    } catch (err) {
      console.error("Error fetching IVA summary:", err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  return { summary, loading: loading || orgLoading, organizationId, fetchIvaSummary };
}
