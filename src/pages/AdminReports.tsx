import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useScheduleConfig } from "@/hooks/useScheduleConfig";
import { supabase } from "@/integrations/supabase/client";
import {
  exportToCSV,
  exportToExcel,
  exportMultiSheetExcel,
  buildTimestamp,
} from "@/lib/exportUtils";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  user_id: string;
  record_type: string;
  recorded_at: string;
  location_id: string;
}

interface LocationInfo {
  id: string;
  name: string;
}

interface ProfileInfo {
  user_id: string;
  full_name: string;
}

interface OrgInfo {
  id: string;
  name: string;
}

type PeriodType = "this_week" | "this_month" | "last_month";

interface EmployeeReport {
  userId: string;
  name: string;
  totalDays: number;
  onTimeDays: number;
  lateDays: number;
  totalHours: number;
  totalMinutes: number;
  punctualityPct: number;
}

interface DailyData {
  date: string;
  label: string;
  entradas: number;
  aTiempo: number;
  tarde: number;
}

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: "this_week", label: "Esta semana" },
  { value: "this_month", label: "Este mes" },
  { value: "last_month", label: "Mes anterior" },
];

const PIE_COLORS = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--muted))"];

const chartConfig = {
  aTiempo: { label: "A tiempo", color: "hsl(var(--success))" },
  tarde: { label: "Tarde", color: "hsl(var(--warning))" },
};

const getActiveOrgIds = (orgs: OrgInfo[], filter: string): string[] => {
  if (filter === "all") return orgs.map((o) => o.id);
  return [filter];
};

interface EmployeeComboboxProps {
  employees: { id: string; name: string }[];
  value: string;
  onValueChange: (value: string) => void;
}

const EmployeeCombobox = ({ employees, value, onValueChange }: EmployeeComboboxProps) => {
  const [open, setOpen] = useState(false);
  const selectedName = value === "all" ? "Todos" : employees.find((e) => e.id === value)?.name ?? "Todos";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selectedName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empleado..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => { onValueChange("all"); setOpen(false); }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === "all" ? "opacity-100" : "opacity-0"}`} />
                Todos
              </CommandItem>
              {employees.map((e) => (
                <CommandItem
                  key={e.id}
                  value={e.name}
                  onSelect={() => { onValueChange(e.id); setOpen(false); }}
                >
                  <Check className={`mr-2 h-4 w-4 ${value === e.id ? "opacity-100" : "opacity-0"}`} />
                  {e.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const AdminReports = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { config: scheduleConfig } = useScheduleConfig();

  const [period, setPeriod] = useState<PeriodType>("this_month");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileInfo>>(new Map());
  const [locations, setLocations] = useState<Map<string, LocationInfo>>(new Map());
  const [organizations, setOrganizations] = useState<OrgInfo[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchOrganizations();
    }
  }, [user, isAdmin, authLoading]);

  // When orgs finish loading, do initial fetch
  useEffect(() => {
    if (!loadingOrgs) {
      if (organizations.length > 0) {
        fetchRecords(getActiveOrgIds(organizations, orgFilter));
      } else {
        setLoadingData(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingOrgs]);

  // Re-fetch when org filter or period changes
  useEffect(() => {
    if (!loadingOrgs && organizations.length > 0) {
      fetchRecords(getActiveOrgIds(organizations, orgFilter));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgFilter, period]);

  // Reset employee filter when org changes
  useEffect(() => {
    setEmployeeFilter("all");
  }, [orgFilter]);

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    switch (period) {
      case "this_week":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month": {
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      }
    }
  };

  const fetchOrganizations = async () => {
    if (!user) return;
    setLoadingOrgs(true);
    const { data } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("name");
    setOrganizations(data || []);
    setLoadingOrgs(false);
  };

const fetchRecords = async (orgIds: string[]) => {
    if (!user || orgIds.length === 0) {
      setRecords([]);
      setProfiles(new Map());
      setLoadingData(false);
      return;
    }
    setLoadingData(true);

    try {
      const { start, end } = getDateRange();

      const { data: orgLocations } = await supabase
        .from("locations")
        .select("id, name")
        .in("organization_id", orgIds);

      const locationIds = orgLocations?.map((l) => l.id) || [];
      if (locationIds.length === 0) {
        setRecords([]);
        setProfiles(new Map());
        setLocations(new Map());
        setLoadingData(false);
        return;
      }

      const locMap = new Map<string, LocationInfo>();
      orgLocations?.forEach((l) => locMap.set(l.id, { id: l.id, name: l.name }));
      setLocations(locMap);

      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, user_id, record_type, recorded_at, location_id")
        .in("location_id", locationIds)
        .gte("recorded_at", start.toISOString())
        .lte("recorded_at", end.toISOString())
        .order("recorded_at", { ascending: true });

      if (error) throw error;

      const recs = data || [];
      setRecords(recs);

      const userIds = [...new Set(recs.map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const map = new Map<string, ProfileInfo>();
        profs?.forEach((p) => map.set(p.user_id, p));
        setProfiles(map);
      } else {
        setProfiles(new Map());
      }
    } catch (err) {
      console.error("Error fetching reports data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleRefresh = () => {
    const ids = getActiveOrgIds(organizations, orgFilter);
    fetchRecords(ids);
  };

  const filteredRecords = useMemo(() => {
    if (employeeFilter === "all") return records;
    return records.filter((r) => r.user_id === employeeFilter);
  }, [records, employeeFilter]);

  const toLocalDateStr = (isoStr: string): string => format(new Date(isoStr), "yyyy-MM-dd");

  const isOnTime = (recordedAt: string): boolean => {
    const d = new Date(recordedAt);
    const scheduleTime = scheduleConfig.entryHour * 60 + scheduleConfig.entryMinute + scheduleConfig.entryToleranceMinutes;
    const recordTime = d.getHours() * 60 + d.getMinutes();
    return recordTime <= scheduleTime;
  };

  const employeeReports = useMemo((): EmployeeReport[] => {
    const byUser = new Map<string, AttendanceRecord[]>();
    for (const r of filteredRecords) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
      byUser.get(r.user_id)!.push(r);
    }

    const reports: EmployeeReport[] = [];
    byUser.forEach((userRecs, userId) => {
      const byDate = new Map<string, { entradas: Date[]; salidas: Date[] }>();
      for (const r of userRecs) {
        const dateKey = toLocalDateStr(r.recorded_at);
        if (!byDate.has(dateKey)) byDate.set(dateKey, { entradas: [], salidas: [] });
        const group = byDate.get(dateKey)!;
        if (r.record_type === "entrada") group.entradas.push(new Date(r.recorded_at));
        else if (r.record_type === "salida") group.salidas.push(new Date(r.recorded_at));
      }

      let totalDays = 0;
      let onTimeDays = 0;
      let lateDays = 0;
      let totalMinutesAll = 0;

      byDate.forEach((group, dateKey) => {
        if (group.entradas.length === 0) return;
        totalDays++;

        const firstEntry = userRecs
          .filter((r) => r.record_type === "entrada" && toLocalDateStr(r.recorded_at) === dateKey)
          .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())[0];

        if (firstEntry && isOnTime(firstEntry.recorded_at)) {
          onTimeDays++;
        } else {
          lateDays++;
        }

        const pairs = Math.min(group.entradas.length, group.salidas.length);
        for (let i = 0; i < pairs; i++) {
          const diff = group.salidas[i].getTime() - group.entradas[i].getTime();
          if (diff > 0) totalMinutesAll += diff / (1000 * 60);
        }
      });

      const punctualityPct = totalDays > 0 ? Math.round((onTimeDays / totalDays) * 100) : 0;

      reports.push({
        userId,
        name: profiles.get(userId)?.full_name || `Usuario ${userId.slice(0, 8)}`,
        totalDays,
        onTimeDays,
        lateDays,
        totalHours: Math.floor(totalMinutesAll / 60),
        totalMinutes: Math.round(totalMinutesAll % 60),
        punctualityPct,
      });
    });

    return reports.sort((a, b) => b.lateDays - a.lateDays);
  }, [filteredRecords, profiles, scheduleConfig]);

  const globalStats = useMemo(() => {
    const totalEmployees = employeeReports.length;
    const totalDaysAll = employeeReports.reduce((sum, e) => sum + e.totalDays, 0);
    const totalOnTime = employeeReports.reduce((sum, e) => sum + e.onTimeDays, 0);
    const totalLate = employeeReports.reduce((sum, e) => sum + e.lateDays, 0);
    const totalMinutes = employeeReports.reduce((sum, e) => sum + e.totalHours * 60 + e.totalMinutes, 0);
    const punctualityPct = totalDaysAll > 0 ? Math.round((totalOnTime / totalDaysAll) * 100) : 0;
    const avgHoursPerDay = totalDaysAll > 0 ? (totalMinutes / 60 / totalDaysAll).toFixed(1) : "0";

    return { totalEmployees, totalDaysAll, totalOnTime, totalLate, totalMinutes, punctualityPct, avgHoursPerDay };
  }, [employeeReports]);

  const dailyChartData = useMemo((): DailyData[] => {
    const { start, end } = getDateRange();
    const today = new Date();
    const effectiveEnd = end > today ? today : end;
    const days = eachDayOfInterval({ start, end: effectiveEnd });

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayEntries = filteredRecords.filter(
        (r) => r.record_type === "entrada" && toLocalDateStr(r.recorded_at) === dayStr
      );
      const onTimeCount = dayEntries.filter((r) => isOnTime(r.recorded_at)).length;
      const lateCount = dayEntries.length - onTimeCount;

      return {
        date: dayStr,
        label: format(day, "EEE dd", { locale: es }),
        entradas: dayEntries.length,
        aTiempo: onTimeCount,
        tarde: lateCount,
      };
    });
  }, [filteredRecords, period, scheduleConfig]);

  const pieData = useMemo(() => {
    return [
      { name: "A tiempo", value: globalStats.totalOnTime },
      { name: "Tarde", value: globalStats.totalLate },
    ].filter((d) => d.value > 0);
  }, [globalStats]);

  const uniqueEmployees = useMemo(() => {
    const ids = [...new Set(records.map((r) => r.user_id))];
    return ids.map((id) => ({
      id,
      name: profiles.get(id)?.full_name || `Usuario ${id.slice(0, 8)}`,
    }));
  }, [records, profiles]);

  const summaryColumns = [
    { header: "Empleado", accessor: (e: EmployeeReport) => e.name },
    { header: "Días trabajados", accessor: (e: EmployeeReport) => e.totalDays },
    { header: "A tiempo", accessor: (e: EmployeeReport) => e.onTimeDays },
    { header: "Tarde", accessor: (e: EmployeeReport) => e.lateDays },
    { header: "% Puntualidad", accessor: (e: EmployeeReport) => `${e.punctualityPct}%` },
    { header: "Horas totales", accessor: (e: EmployeeReport) => `${e.totalHours}h ${e.totalMinutes}m` },
  ];

  const detailColumns = [
    { header: "Empleado", accessor: (r: AttendanceRecord) => profiles.get(r.user_id)?.full_name || r.user_id.slice(0, 8) },
    { header: "Fecha", accessor: (r: AttendanceRecord) => format(new Date(r.recorded_at), "dd/MM/yyyy") },
    { header: "Hora", accessor: (r: AttendanceRecord) => format(new Date(r.recorded_at), "HH:mm:ss") },
    { header: "Tipo", accessor: (r: AttendanceRecord) => r.record_type === "entrada" ? "Entrada" : "Salida" },
    { header: "Ubicación", accessor: (r: AttendanceRecord) => locations.get(r.location_id)?.name || "—" },
    { header: "Puntualidad", accessor: (r: AttendanceRecord) => {
      if (r.record_type !== "entrada") return "—";
      return isOnTime(r.recorded_at) ? "A tiempo" : "Tarde";
    }},
  ];

  const ts = buildTimestamp();
  const periodSuffix = PERIOD_OPTIONS.find((o) => o.value === period)?.label.toLowerCase().replace(/ /g, "_") ?? period;

  const handleExportSummaryCSV = () => {
    exportToCSV(employeeReports, summaryColumns, `resumen_asistencia_${periodSuffix}_${ts}.csv`);
  };

  const handleExportSummaryExcel = () => {
    exportToExcel(employeeReports, summaryColumns, `resumen_asistencia_${periodSuffix}_${ts}.xlsx`, "Resumen");
  };

  const handleExportDetailCSV = () => {
    const sorted = [...filteredRecords].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    exportToCSV(sorted, detailColumns, `detalle_asistencia_${periodSuffix}_${ts}.csv`);
  };

  const handleExportDetailExcel = () => {
    const sorted = [...filteredRecords].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    exportToExcel(sorted, detailColumns, `detalle_asistencia_${periodSuffix}_${ts}.xlsx`, "Detalle");
  };

  const handleExportCompleteExcel = () => {
    const sortedRecords = [...filteredRecords].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const summaryHeaders = summaryColumns.map((c) => c.header);
    const summaryRows = employeeReports.map((e) =>
      summaryColumns.map((c) => c.accessor(e))
    );

    const detailHeaders = detailColumns.map((c) => c.header);
    const detailRows = sortedRecords.map((r) =>
      detailColumns.map((c) => c.accessor(r))
    );

    exportMultiSheetExcel(
      [
        { name: "Resumen", headers: summaryHeaders, rows: summaryRows },
        { name: "Detalle registros", headers: detailHeaders, rows: detailRows },
      ],
      `reporte_completo_${periodSuffix}_${ts}.xlsx`,
    );
  };

  if (authLoading || loadingOrgs) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { start: rangeStart, end: rangeEnd } = getDateRange();
  const periodLabel = `${format(rangeStart, "d MMM", { locale: es })} - ${format(rangeEnd, "d MMM yyyy", { locale: es })}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Reportes y Estadísticas</h1>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loadingData} aria-label="Actualizar datos">
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={filteredRecords.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                  <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Resumen por empleado</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportSummaryCSV} disabled={employeeReports.length === 0}>
                  <FileText className="w-4 h-4 mr-2" />
                  Resumen CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSummaryExcel} disabled={employeeReports.length === 0}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Resumen Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Registros detallados</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportDetailCSV}>
                  <FileText className="w-4 h-4 mr-2" />
                  Detalle CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDetailExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Detalle Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCompleteExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Reporte completo (Excel)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {organizations.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No se encontró ninguna organización</p>
              <p className="text-sm text-muted-foreground mt-1">Crea una organización primero desde el panel de administración</p>
              <Link to="/admin/users" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Ir a Organizaciones</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
        <>
        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 min-w-[160px]">
                <label className="text-sm font-medium text-muted-foreground">Período</label>
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {organizations.length > 1 && (
                <div className="space-y-1.5 min-w-[180px]">
                  <label className="text-sm font-medium text-muted-foreground">Organización</label>
                  <Select value={orgFilter} onValueChange={setOrgFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5" />
                          Todas
                        </div>
                      </SelectItem>
                      {organizations.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5" />
                            {o.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

{uniqueEmployees.length > 0 && (
                <div className="space-y-1.5 min-w-[200px]">
                  <label className="text-sm font-medium text-muted-foreground">Empleado</label>
                  <EmployeeCombobox
                    employees={uniqueEmployees}
                    value={employeeFilter}
                    onValueChange={setEmployeeFilter}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{globalStats.totalEmployees}</p>
                      <p className="text-xs text-muted-foreground">Empleados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{globalStats.punctualityPct}%</p>
                      <p className="text-xs text-muted-foreground">Puntualidad</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{globalStats.avgHoursPerDay}h</p>
                      <p className="text-xs text-muted-foreground">Prom. horas/día</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{globalStats.totalLate}</p>
                      <p className="text-xs text-muted-foreground">Tardanzas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="daily" className="space-y-4">
              <TabsList>
                <TabsTrigger value="daily">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Asistencia diaria
                </TabsTrigger>
                <TabsTrigger value="punctuality">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Puntualidad
                </TabsTrigger>
              </TabsList>

              <TabsContent value="daily">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Entradas por día
                    </CardTitle>
                    <CardDescription>Registros de entrada a tiempo vs. tarde</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dailyChartData.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay datos para el período seleccionado</p>
                      </div>
                    ) : (
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                          <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="aTiempo" stackId="a" fill="var(--color-aTiempo)" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="tarde" stackId="a" fill="var(--color-tarde)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="punctuality">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Distribución de puntualidad
                    </CardTitle>
                    <CardDescription>Porcentaje de llegadas a tiempo vs. tarde</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pieData.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay datos para el período seleccionado</p>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row items-center gap-8">
                        <ChartContainer config={chartConfig} className="h-[250px] w-full max-w-[300px]">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              dataKey="value"
                              strokeWidth={2}
                            >
                              {pieData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                        <div className="space-y-4 flex-1 w-full">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[0] }} />
                                <span>A tiempo</span>
                              </div>
                              <span className="font-mono font-semibold">{globalStats.totalOnTime}</span>
                            </div>
                            <Progress value={globalStats.punctualityPct} className="h-2" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ background: PIE_COLORS[1] }} />
                                <span>Tarde</span>
                              </div>
                              <span className="font-mono font-semibold">{globalStats.totalLate}</span>
                            </div>
                            <Progress value={100 - globalStats.punctualityPct} className="h-2 [&>div]:bg-warning" />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Employee Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Reporte por empleado
                </CardTitle>
                <CardDescription>
                  Ordenado por cantidad de tardanzas (mayor a menor)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {employeeReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay registros para el período seleccionado</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Empleado</TableHead>
                          <TableHead className="font-semibold text-center">Días</TableHead>
                          <TableHead className="font-semibold text-center">A tiempo</TableHead>
                          <TableHead className="font-semibold text-center">Tarde</TableHead>
                          <TableHead className="font-semibold text-center">Puntualidad</TableHead>
                          <TableHead className="font-semibold text-right">Horas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeReports.map((emp) => (
                          <TableRow key={emp.userId} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{emp.name}</TableCell>
                            <TableCell className="text-center">{emp.totalDays}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                {emp.onTimeDays}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {emp.lateDays > 0 ? (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                                  {emp.lateDays}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <Progress
                                  value={emp.punctualityPct}
                                  className="h-2 w-16"
                                />
                                <span className="text-xs font-mono w-8">{emp.punctualityPct}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {emp.totalHours}h {emp.totalMinutes}m
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
        </>
        )}
      </main>
    </div>
  );
};

export default AdminReports;
