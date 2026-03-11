import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizationId } from "@/hooks/useOrganizationId";

export interface ExchangeRate {
  id: string;
  organization_id: string;
  currency: string;
  rate: number;
  date: string;
  source: string;
  created_by: string | null;
  created_at: string;
}

export function useExchangeRate() {
  const { organizationId, loading: orgLoading, user } = useOrganizationId();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select("*")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false })
        .limit(100);
      if (error) throw error;
      setRates((data as unknown as ExchangeRate[]) || []);
    } catch (err) {
      console.error("Error fetching exchange rates:", err);
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading && organizationId) fetchRates();
  }, [orgLoading, organizationId, fetchRates]);

  const createRate = useCallback(async (params: {
    currency?: string;
    rate: number;
    date?: string;
    source?: string;
  }) => {
    if (!organizationId || !user) return { error: "Sin organización" };
    const { error } = await supabase.from("exchange_rates").insert({
      organization_id: organizationId,
      currency: params.currency || "USD",
      rate: params.rate,
      date: params.date || new Date().toISOString().split("T")[0],
      source: params.source || "manual",
      created_by: user.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (!error) await fetchRates();
    return { error: error?.message || null };
  }, [organizationId, user, fetchRates]);

  const latestRate = rates.length > 0 ? rates[0] : null;

  return { rates, latestRate, loading: loading || orgLoading, organizationId, createRate, refetch: fetchRates };
}
