import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type VacationRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface VacationBalance {
  id: string;
  user_id: string;
  organization_id: string;
  year: number;
  total_days: number;
  used_days: number;
  created_at: string;
  updated_at: string;
}

export interface VacationRequest {
  id: string;
  user_id: string;
  organization_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: VacationRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface RequestVacationParams {
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string;
}

interface ReviewRequestParams {
  id: string;
  status: "approved" | "rejected";
  reviewNotes?: string;
}

interface UpdateBalanceParams {
  userId: string;
  year: number;
  totalDays: number;
}

export function useVacations() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchOrganizationId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    if (isAdmin) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      return data?.[0]?.id || null;
    }

    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    return data?.organization_id || null;
  }, [user, isAdmin]);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;
    setLoading(true);

    try {
      const orgId = await fetchOrganizationId();
      setOrganizationId(orgId);
      if (!orgId) {
        setBalance(null);
        setRequests([]);
        return;
      }

      const currentYear = new Date().getFullYear();

      const { data: balanceData } = await supabase
        .from("vacation_balances")
        .select("*")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .eq("year", currentYear)
        .maybeSingle();

      setBalance(balanceData as VacationBalance | null);

      let query = supabase
        .from("vacation_requests")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data: requestsData, error } = await query;
      if (error) throw error;

      const reqs = (requestsData as unknown as VacationRequest[]) || [];

      // Fetch profile names for requests
      const reqUserIds = [...new Set(reqs.map((r) => r.user_id))];
      if (reqUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", reqUserIds);
        const profileMap = new Map((profilesData || []).map((p) => [p.user_id, p.full_name]));
        reqs.forEach((r) => {
          const name = profileMap.get(r.user_id);
          if (name) r.profiles = { full_name: name };
        });
      }

      setRequests(reqs);
    } catch (err) {
      console.error("Error fetching vacations:", err);
      setBalance(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading, fetchOrganizationId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  const requestVacation = useCallback(
    async (params: RequestVacationParams) => {
      if (!user || !organizationId) return { error: "Sin organización" };

      const { error } = await supabase.from("vacation_requests").insert({
        user_id: user.id,
        organization_id: organizationId,
        start_date: params.startDate,
        end_date: params.endDate,
        days_count: params.daysCount,
        reason: params.reason || null,
      });

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [user, organizationId, fetchData],
  );

  const cancelRequest = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("vacation_requests")
        .update({ status: "cancelled" as VacationRequestStatus })
        .eq("id", id);

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [fetchData],
  );

  const reviewRequest = useCallback(
    async (params: ReviewRequestParams) => {
      if (!user) return { error: "No autenticado" };

      const { error } = await supabase
        .from("vacation_requests")
        .update({
          status: params.status as VacationRequestStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: params.reviewNotes || null,
        })
        .eq("id", params.id);

      if (error) return { error: error.message };

      if (params.status === "approved") {
        const request = requests.find((r) => r.id === params.id);
        if (request) {
          const currentYear = new Date().getFullYear();
          const { data: currentBalance } = await supabase
            .from("vacation_balances")
            .select("*")
            .eq("user_id", request.user_id)
            .eq("organization_id", request.organization_id)
            .eq("year", currentYear)
            .maybeSingle();

          if (currentBalance) {
            await supabase
              .from("vacation_balances")
              .update({
                used_days: (currentBalance as VacationBalance).used_days + request.days_count,
                updated_at: new Date().toISOString(),
              })
              .eq("id", (currentBalance as VacationBalance).id);
          }
        }
      }

      await fetchData();
      return { error: null };
    },
    [user, requests, fetchData],
  );

  const updateBalance = useCallback(
    async (params: UpdateBalanceParams) => {
      if (!organizationId) return { error: "Sin organización" };

      const { data: existing } = await supabase
        .from("vacation_balances")
        .select("id")
        .eq("user_id", params.userId)
        .eq("organization_id", organizationId)
        .eq("year", params.year)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("vacation_balances")
          .update({
            total_days: params.totalDays,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id));
      } else {
        ({ error } = await supabase.from("vacation_balances").insert({
          user_id: params.userId,
          organization_id: organizationId,
          year: params.year,
          total_days: params.totalDays,
          used_days: 0,
        }));
      }

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [organizationId, fetchData],
  );

  return {
    balance,
    requests,
    loading,
    organizationId,
    requestVacation,
    cancelRequest,
    reviewRequest,
    updateBalance,
    refetch: fetchData,
  };
}
