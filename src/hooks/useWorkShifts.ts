import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type WorkShift = {
  id: string;
  organization_id: string;
  name: string;
  start_time: string;
  end_time: string;
  entry_grace_minutes: number;
  exit_grace_minutes: number;
  active_days: number[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkShiftInput = {
  name: string;
  start_time: string;
  end_time: string;
  entry_grace_minutes: number;
  exit_grace_minutes: number;
  active_days: number[];
  is_default: boolean;
};

const DEFAULT_SHIFT_INPUT: WorkShiftInput = {
  name: "",
  start_time: "09:00:00",
  end_time: "18:00:00",
  entry_grace_minutes: 15,
  exit_grace_minutes: 60,
  active_days: [1, 2, 3, 4, 5],
  is_default: false,
};

export function useWorkShifts() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchOrganizationId = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    return data?.[0]?.id || null;
  }, [user]);

  const loadShifts = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orgId = await fetchOrganizationId();
      setOrganizationId(orgId);

      if (!orgId) {
        setShifts([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("work_shifts")
        .select("*")
        .eq("organization_id", orgId)
        .order("is_default", { ascending: false })
        .order("name");

      if (fetchError) {
        console.error("Error fetching shifts:", fetchError);
        setError("Error al cargar turnos");
        return;
      }

      setShifts((data as WorkShift[]) || []);
    } catch (err) {
      console.error("Error loading shifts:", err);
      setError("Error inesperado al cargar turnos");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, fetchOrganizationId]);

  const createShift = useCallback(async (input: WorkShiftInput): Promise<WorkShift | null> => {
    if (!user || !isAdmin || !organizationId) return null;

    try {
      setSaving(true);
      setError(null);

      if (input.is_default) {
        await supabase
          .from("work_shifts")
          .update({ is_default: false })
          .eq("organization_id", organizationId)
          .eq("is_default", true);
      }

      const { data, error: insertError } = await supabase
        .from("work_shifts")
        .insert({
          organization_id: organizationId,
          name: input.name,
          start_time: input.start_time,
          end_time: input.end_time,
          entry_grace_minutes: input.entry_grace_minutes,
          exit_grace_minutes: input.exit_grace_minutes,
          active_days: input.active_days,
          is_default: input.is_default,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating shift:", insertError);
        setError("Error al crear turno");
        return null;
      }

      await loadShifts();
      return data as WorkShift;
    } catch (err) {
      console.error("Error creating shift:", err);
      setError("Error inesperado al crear turno");
      return null;
    } finally {
      setSaving(false);
    }
  }, [user, isAdmin, organizationId, loadShifts]);

  const updateShift = useCallback(async (shiftId: string, input: WorkShiftInput): Promise<boolean> => {
    if (!user || !isAdmin || !organizationId) return false;

    try {
      setSaving(true);
      setError(null);

      if (input.is_default) {
        await supabase
          .from("work_shifts")
          .update({ is_default: false })
          .eq("organization_id", organizationId)
          .eq("is_default", true)
          .neq("id", shiftId);
      }

      const { error: updateError } = await supabase
        .from("work_shifts")
        .update({
          name: input.name,
          start_time: input.start_time,
          end_time: input.end_time,
          entry_grace_minutes: input.entry_grace_minutes,
          exit_grace_minutes: input.exit_grace_minutes,
          active_days: input.active_days,
          is_default: input.is_default,
        })
        .eq("id", shiftId);

      if (updateError) {
        console.error("Error updating shift:", updateError);
        setError("Error al actualizar turno");
        return false;
      }

      await loadShifts();
      return true;
    } catch (err) {
      console.error("Error updating shift:", err);
      setError("Error inesperado al actualizar turno");
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, isAdmin, organizationId, loadShifts]);

  const deleteShift = useCallback(async (shiftId: string): Promise<boolean> => {
    if (!user || !isAdmin || !organizationId) return false;

    const target = shifts.find(s => s.id === shiftId);
    if (target?.is_default) {
      setError("No se puede eliminar el turno por defecto. Asigna otro turno como principal primero.");
      return false;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from("work_shifts")
        .delete()
        .eq("id", shiftId);

      if (deleteError) {
        console.error("Error deleting shift:", deleteError);
        setError("Error al eliminar turno");
        return false;
      }

      await loadShifts();
      return true;
    } catch (err) {
      console.error("Error deleting shift:", err);
      setError("Error inesperado al eliminar turno");
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, isAdmin, organizationId, shifts, loadShifts]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  return {
    shifts,
    loading,
    saving,
    error,
    organizationId,
    createShift,
    updateShift,
    deleteShift,
    loadShifts,
    defaultShiftInput: DEFAULT_SHIFT_INPUT,
    clearError: () => setError(null),
  };
}
