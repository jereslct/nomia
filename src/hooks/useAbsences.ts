import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AbsenceType =
  | "unjustified"
  | "justified"
  | "medical_certificate"
  | "birth_leave"
  | "other_leave";

export type AbsenceStatus = "pending" | "approved" | "rejected";

export interface Absence {
  id: string;
  user_id: string;
  organization_id: string;
  date: string;
  type: AbsenceType;
  justification: string | null;
  certificate_url: string | null;
  certificate_file_name: string | null;
  status: AbsenceStatus;
  reported_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}

interface CreateAbsenceParams {
  user_id: string;
  date: string;
  type: AbsenceType;
  justification?: string;
  organization_id?: string;
}

interface UpdateStatusParams {
  id: string;
  status: AbsenceStatus;
  reviewed_by: string;
}

interface UpdateJustificationParams {
  id: string;
  justification: string;
  certificate_url?: string;
  certificate_file_name?: string;
}

export function useAbsences(userId?: string, externalOrgId?: string | null) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
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

  const fetchAbsences = useCallback(async () => {
    if (authLoading || !user) return;
    setLoading(true);

    try {
      const orgId = externalOrgId || await fetchOrganizationId();
      setOrganizationId(orgId);
      if (!orgId) {
        setAbsences([]);
        return;
      }

      let query = supabase
        .from("absences")
        .select("*")
        .eq("organization_id", orgId)
        .order("date", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      } else if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const absencesList = (data as unknown as Absence[]) || [];

      // Fetch profile names
      const userIds = [...new Set(absencesList.map((a) => a.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
        absencesList.forEach((a) => {
          const name = profileMap.get(a.user_id);
          if (name) a.profiles = { full_name: name };
        });
      }

      setAbsences(absencesList);
    } catch (err) {
      console.error("Error fetching absences:", err);
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading, userId, externalOrgId, fetchOrganizationId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAbsences();
    }
  }, [authLoading, user, fetchAbsences]);

  const createAbsence = useCallback(
    async (params: CreateAbsenceParams) => {
      if (!user) return { error: "Sin usuario" };
      const orgId = params.organization_id || organizationId;
      if (!orgId) return { error: "Sin organización" };

      const { error } = await supabase.from("absences").insert({
        user_id: params.user_id,
        organization_id: orgId,
        date: params.date,
        type: params.type,
        justification: params.justification || null,
        reported_by: user.id,
      });

      if (!error) await fetchAbsences();
      return { error: error?.message || null };
    },
    [user, organizationId, fetchAbsences],
  );

  const updateAbsenceStatus = useCallback(
    async (params: UpdateStatusParams) => {
      const { error } = await supabase
        .from("absences")
        .update({
          status: params.status,
          reviewed_by: params.reviewed_by,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (!error) await fetchAbsences();
      return { error: error?.message || null };
    },
    [fetchAbsences],
  );

  const updateAbsenceJustification = useCallback(
    async (params: UpdateJustificationParams) => {
      const updates: Record<string, unknown> = {
        justification: params.justification,
      };
      if (params.certificate_url) {
        updates.certificate_url = params.certificate_url;
        updates.certificate_file_name = params.certificate_file_name || null;
      }
      // Re-set to pending so admin can review the new justification
      updates.status = "pending";

      const { error } = await supabase
        .from("absences")
        .update(updates)
        .eq("id", params.id);

      if (!error) await fetchAbsences();
      return { error: error?.message || null };
    },
    [fetchAbsences],
  );

  return {
    absences,
    loading,
    organizationId,
    createAbsence,
    updateAbsenceStatus,
    updateAbsenceJustification,
    refetch: fetchAbsences,
  };
}
