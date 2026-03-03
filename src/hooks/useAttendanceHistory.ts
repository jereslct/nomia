import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

interface AttendanceRecord {
  id: string;
  record_type: string;
  recorded_at: string;
  location_id: string;
  locations?: { name: string };
}

interface UseAttendanceHistoryOptions {
  userId: string | undefined;
  selectedMonth: Date;
  page: number;
  pageSize: number;
}

async function fetchHistoryPage({ userId, selectedMonth, page, pageSize }: UseAttendanceHistoryOptions) {
  if (!userId) return { records: [] as AttendanceRecord[], totalCount: 0 };

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const offset = (page - 1) * pageSize;

  const { count } = await supabase
    .from("attendance_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("recorded_at", monthStart.toISOString())
    .lte("recorded_at", monthEnd.toISOString());

  const { data, error } = await supabase
    .from("attendance_records")
    .select(`id, record_type, recorded_at, location_id, locations (name)`)
    .eq("user_id", userId)
    .gte("recorded_at", monthStart.toISOString())
    .lte("recorded_at", monthEnd.toISOString())
    .order("recorded_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;
  return { records: (data || []) as AttendanceRecord[], totalCount: count || 0 };
}

export function useAttendanceHistory(options: UseAttendanceHistoryOptions) {
  return useQuery({
    queryKey: ["attendance-history", options.userId, options.selectedMonth.toISOString().slice(0, 7), options.page],
    queryFn: () => fetchHistoryPage(options),
    enabled: !!options.userId,
    staleTime: 30_000,
  });
}
