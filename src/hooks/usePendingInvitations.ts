import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PendingInvitation {
  id: string;
  invited_email: string;
  created_at: string;
  organization_id: string;
  organization_name: string;
}

interface UsePendingInvitationsResult {
  pendingCount: number;
  pendingInvitations: PendingInvitation[];
  loading: boolean;
  refetch: () => void;
}

export const usePendingInvitations = (
  userId: string | undefined,
  isAdmin: boolean | undefined
): UsePendingInvitationsResult => {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingInvitations = useCallback(async () => {
    if (!userId || !isAdmin) {
      setPendingInvitations([]);
      setLoading(false);
      return;
    }

    try {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("owner_id", userId);

      if (!orgs || orgs.length === 0) {
        setPendingInvitations([]);
        setLoading(false);
        return;
      }

      const orgIds = orgs.map((o) => o.id);
      const orgMap = new Map(orgs.map((o) => [o.id, o.name]));

      const { data: members, error } = await supabase
        .from("organization_members")
        .select("id, invited_email, created_at, organization_id")
        .in("organization_id", orgIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const invitations: PendingInvitation[] = (members || []).map((m) => ({
        id: m.id,
        invited_email: m.invited_email,
        created_at: m.created_at,
        organization_id: m.organization_id,
        organization_name: orgMap.get(m.organization_id) || "Desconocida",
      }));

      setPendingInvitations(invitations);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  useEffect(() => {
    if (!userId || !isAdmin) return;

    const channel = supabase
      .channel("pending-invitations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "organization_members",
        },
        () => {
          fetchPendingInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isAdmin, fetchPendingInvitations]);

  return {
    pendingCount: pendingInvitations.length,
    pendingInvitations,
    loading,
    refetch: fetchPendingInvitations,
  };
};
