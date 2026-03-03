import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyStats {
  daysWorked: number;
  totalHours: number;
  totalMinutes: number;
}

async function fetchMonthlyStats(userId: string, isAdmin: boolean): Promise<MonthlyStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  let query = supabase
    .from("attendance_records")
    .select("user_id, record_type, recorded_at")
    .gte("recorded_at", monthStart)
    .lte("recorded_at", monthEnd)
    .order("recorded_at", { ascending: true });

  if (!isAdmin) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error || !data) return { daysWorked: 0, totalHours: 0, totalMinutes: 0 };

  const byUserDate = new Map<string, { entradas: Date[]; salidas: Date[] }>();
  for (const r of data) {
    const dateKey = `${r.user_id}_${r.recorded_at.split("T")[0]}`;
    if (!byUserDate.has(dateKey)) byUserDate.set(dateKey, { entradas: [], salidas: [] });
    const group = byUserDate.get(dateKey)!;
    if (r.record_type === "entrada") group.entradas.push(new Date(r.recorded_at));
    else if (r.record_type === "salida") group.salidas.push(new Date(r.recorded_at));
  }

  let daysWithEntry = 0;
  let totalMinutesWorked = 0;

  byUserDate.forEach((group) => {
    if (group.entradas.length > 0) daysWithEntry++;
    const pairs = Math.min(group.entradas.length, group.salidas.length);
    for (let i = 0; i < pairs; i++) {
      const diff = group.salidas[i].getTime() - group.entradas[i].getTime();
      if (diff > 0) totalMinutesWorked += diff / (1000 * 60);
    }
  });

  return {
    daysWorked: daysWithEntry,
    totalHours: Math.floor(totalMinutesWorked / 60),
    totalMinutes: Math.round(totalMinutesWorked % 60),
  };
}

export function useMonthlyStats(userId: string | undefined, isAdmin: boolean) {
  return useQuery({
    queryKey: ["monthly-stats", userId, isAdmin],
    queryFn: () => fetchMonthlyStats(userId!, isAdmin),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
