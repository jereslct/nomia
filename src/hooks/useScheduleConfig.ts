import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ScheduleConfig = {
  id?: string;
  entryHour: number;
  entryMinute: number;
  exitHour: number;
  exitMinute: number;
  entryToleranceMinutes: number;
  exitToleranceMinutes: number;
  activeDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
};

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
};

const DEFAULT_CONFIG: ScheduleConfig = {
  entryHour: 9,
  entryMinute: 0,
  exitHour: 18,
  exitMinute: 0,
  entryToleranceMinutes: 15,
  exitToleranceMinutes: 60,
  activeDays: [1, 2, 3, 4, 5], // Monday to Friday
};

const parseTimeString = (timeStr: string): { hour: number; minute: number } => {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
};

const formatTimeForDB = (hour: number, minute: number): string => {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
};

export function useScheduleConfig() {
  const { user, isAdmin } = useAuth();
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Fetch organization ID for the current user
  const fetchOrganizationId = useCallback(async () => {
    if (!user) return null;

    // If admin, get their owned organization
    if (isAdmin) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      return data?.id || null;
    }

    // If employee, get their organization through membership
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    return data?.organization_id || null;
  }, [user, isAdmin]);

  // Load schedule config from database
  const loadConfig = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orgId = await fetchOrganizationId();
      setOrganizationId(orgId);

      if (!orgId) {
        // No organization, use defaults
        setConfig(DEFAULT_CONFIG);
        setLoading(false);
        return;
      }

      // Fetch the default work shift for the organization
      const { data: shift, error: shiftError } = await supabase
        .from("work_shifts")
        .select("*")
        .eq("organization_id", orgId)
        .eq("is_default", true)
        .maybeSingle();

      if (shiftError) {
        console.error("Error fetching work shift:", shiftError);
        setError("Error al cargar configuración de horarios");
        setConfig(DEFAULT_CONFIG);
      } else if (shift) {
        const startTime = parseTimeString(shift.start_time);
        const endTime = parseTimeString(shift.end_time);

        setConfig({
          id: shift.id,
          entryHour: startTime.hour,
          entryMinute: startTime.minute,
          exitHour: endTime.hour,
          exitMinute: endTime.minute,
          entryToleranceMinutes: shift.entry_grace_minutes,
          exitToleranceMinutes: shift.exit_grace_minutes,
          activeDays: shift.active_days || DEFAULT_CONFIG.activeDays,
        });
      } else {
        // No shift exists, use defaults
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.error("Error loading schedule config:", err);
      setError("Error inesperado al cargar horarios");
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, [user, fetchOrganizationId]);

  // Save schedule config to database (admin only)
  const saveConfig = useCallback(async (newConfig: ScheduleConfig): Promise<boolean> => {
    if (!user || !isAdmin || !organizationId) {
      console.error("Cannot save: no user, not admin, or no organization");
      return false;
    }

    try {
      const shiftData = {
        organization_id: organizationId,
        name: "Horario Principal",
        start_time: formatTimeForDB(newConfig.entryHour, newConfig.entryMinute),
        end_time: formatTimeForDB(newConfig.exitHour, newConfig.exitMinute),
        entry_grace_minutes: newConfig.entryToleranceMinutes,
        exit_grace_minutes: newConfig.exitToleranceMinutes,
        active_days: newConfig.activeDays,
        is_default: true,
      };

      if (newConfig.id) {
        // Update existing shift
        const { error } = await supabase
          .from("work_shifts")
          .update(shiftData)
          .eq("id", newConfig.id);

        if (error) {
          console.error("Error updating work shift:", error);
          return false;
        }
      } else {
        // Create new shift
        const { data, error } = await supabase
          .from("work_shifts")
          .insert(shiftData)
          .select("id")
          .single();

        if (error) {
          console.error("Error creating work shift:", error);
          return false;
        }

        newConfig.id = data.id;
      }

      setConfig(newConfig);
      return true;
    } catch (err) {
      console.error("Error saving schedule config:", err);
      return false;
    }
  }, [user, isAdmin, organizationId]);

  // Update config locally (for form state)
  const updateConfig = useCallback((updates: Partial<ScheduleConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Load config on mount and when user changes
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const formatted = useMemo(() => {
    const entry = `${String(config.entryHour).padStart(2, "0")}:${String(config.entryMinute).padStart(2, "0")}`;
    const exit = `${String(config.exitHour).padStart(2, "0")}:${String(config.exitMinute).padStart(2, "0")}`;
    return { entry, exit };
  }, [config]);

  const dayNames = useMemo(() => {
    const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return config.activeDays.map(d => names[d]).join(", ");
  }, [config.activeDays]);

  return { 
    config, 
    setConfig: updateConfig,
    saveConfig,
    loadConfig,
    formatted, 
    dayNames,
    defaults: DEFAULT_CONFIG,
    loading,
    error,
    organizationId,
    isConfigured: !!config.id,
  };
}
