import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, QrCode, RefreshCw, Users, Clock, MapPin, Loader2, BarChart3, UserX, ClipboardPen, LogIn, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useScheduleConfig } from "@/hooks/useScheduleConfig";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell } from "recharts";
import QRCode from "react-qr-code";

interface AttendanceRecord {
  id: string;
  user_id: string;
  record_type: string;
  recorded_at: string;
  location_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  locations: {
    name: string;
    organization_id: string | null;
    organizations: {
      name: string;
    } | null;
  } | null;
}

interface EmployeeStatus {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  entryTime: string | null;
  exitTime: string | null;
  status: "presente" | "tarde" | "finalizado" | "ausente";
  location: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "presente":
      return <Badge className="bg-success text-success-foreground hover:bg-success/80">Presente</Badge>;
    case "tarde":
      return <Badge className="bg-warning text-warning-foreground hover:bg-warning/80">Tarde</Badge>;
    case "finalizado":
      return <Badge variant="secondary">Finalizado</Badge>;
    case "ausente":
      return <Badge variant="outline">Ausente</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const isLateForSchedule = (
  entryTime: string,
  entryHour: number,
  entryMinute: number,
  toleranceMinutes: number
): boolean => {
  const entryDate = new Date(entryTime);
  const totalEntryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes();
  const deadlineMinutes = entryHour * 60 + entryMinute + toleranceMinutes;
  return totalEntryMinutes > deadlineMinutes;
};

const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

type StatusFilter = "todos" | "presente" | "tarde" | "ausente" | "finalizado";

const STATUS_CHART_COLORS: Record<string, string> = {
  presente: "hsl(var(--success))",
  tarde: "hsl(var(--warning))",
  ausente: "hsl(var(--muted-foreground))",
  finalizado: "hsl(var(--secondary))",
};

const chartConfig = {
  presente: { label: "En Horario", color: "hsl(var(--success))" },
  tarde: { label: "Tarde", color: "hsl(var(--warning))" },
  ausente: { label: "Ausente", color: "hsl(var(--muted-foreground))" },
  finalizado: { label: "Finalizado", color: "hsl(var(--secondary))" },
};

interface LocationOption {
  id: string;
  name: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading } = useAuth();
  const { config: scheduleConfig, organizationId: scheduleOrgId } = useScheduleConfig();
  const { toast } = useToast();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const previousLateIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Manual registration state
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualUserId, setManualUserId] = useState("");
  const [manualRecordType, setManualRecordType] = useState<"entrada" | "salida">("entrada");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualLocationId, setManualLocationId] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [locations, setLocations] = useState<LocationOption[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchTodayAttendance();
      initializeLocation();
    }
  }, [user, isAdmin]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel("attendance-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_records",
        },
        () => {
          fetchTodayAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  const initializeLocation = async () => {
    if (!user) return;

    try {
      const { data: existingOrgs } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      const orgId = existingOrgs?.[0]?.id;
      if (!orgId) return;

      setOrganizationId(orgId);

      const { data: existingLocations } = await supabase
        .from("locations")
        .select("id")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1);

      const existingLocation = existingLocations?.[0] ?? null;

      if (existingLocation) {
        setLocationId(existingLocation.id);
      }
    } catch (error) {
      console.error("Error initializing location:", error);
    }
  };

  const fetchLocations = async (orgId: string) => {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    setLocations(data || []);
  };

  useEffect(() => {
    if (organizationId) {
      fetchLocations(organizationId);
    }
  }, [organizationId]);

  const openManualDialog = (employee?: EmployeeStatus) => {
    const now = new Date();
    setManualUserId(employee?.user_id || "");
    setManualRecordType(
      employee?.status === "presente" || employee?.status === "tarde" ? "salida" : "entrada"
    );
    setManualDate(now.toISOString().split("T")[0]);
    setManualTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    );
    setManualLocationId(locationId || locations[0]?.id || "");
    setManualDialogOpen(true);
  };

  // Auto-open manual dialog when navigated from Dashboard
  useEffect(() => {
    if (location.state?.openManualRegister) {
      openManualDialog();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleManualRecord = async () => {
    if (!manualUserId || !manualLocationId || !manualDate || !manualTime) {
      toast({
        title: "Campos incompletos",
        description: "Completa todos los campos para registrar la asistencia.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingManual(true);
    try {
      const recordedAt = new Date(`${manualDate}T${manualTime}:00`).toISOString();

      const { error } = await supabase.from("attendance_records").insert({
        user_id: manualUserId,
        record_type: manualRecordType,
        location_id: manualLocationId,
        recorded_at: recordedAt,
      });

      if (error) throw error;

      const emp = employees.find((e) => e.user_id === manualUserId);
      toast({
        title: "Registro creado",
        description: `${manualRecordType === "entrada" ? "Entrada" : "Salida"} registrada para ${emp?.name || "el empleado"} a las ${manualTime}.`,
      });

      setManualDialogOpen(false);
      fetchTodayAttendance();
    } catch (error) {
      console.error("Error creating manual record:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el registro. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const fetchOrgMembers = async (orgId: string): Promise<Map<string, { full_name: string; avatar_url: string | null }>> => {
    const membersMap = new Map<string, { full_name: string; avatar_url: string | null }>();

    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("status", "accepted")
      .not("user_id", "is", null);

    if (!members) return membersMap;

    const memberUserIds = members
      .map((m) => m.user_id)
      .filter((id): id is string => id !== null);

    if (memberUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", memberUserIds);

      profiles?.forEach((p) => {
        membersMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });
    }

    return membersMap;
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: records, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          user_id,
          record_type,
          recorded_at,
          location_id,
          locations (
            name,
            organization_id,
            organizations (
              name
            )
          )
        `)
        .gte("recorded_at", `${today}T00:00:00`)
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("Error fetching attendance:", error);
        setIsLoadingData(false);
        return;
      }

      const userIds = [...new Set(records?.map((r) => r.user_id) || [])];

      let profilesMap = new Map<string, { full_name: string; avatar_url: string | null }>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        profiles?.forEach((p) => {
          profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
        });
      }

      const recordsWithProfiles = records?.map((r) => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || null,
      })) || [];

      // Fetch all org members for absent calculation
      const resolvedOrgId = organizationId || scheduleOrgId;
      let allMembersMap = new Map<string, { full_name: string; avatar_url: string | null }>();
      if (resolvedOrgId) {
        allMembersMap = await fetchOrgMembers(resolvedOrgId);
      }

      processRecords(recordsWithProfiles as AttendanceRecord[], allMembersMap);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const processRecords = (
    records: AttendanceRecord[],
    allMembersMap: Map<string, { full_name: string; avatar_url: string | null }>
  ) => {
    const userRecords = new Map<string, AttendanceRecord[]>();

    records.forEach((record) => {
      const existing = userRecords.get(record.user_id) || [];
      existing.push(record);
      userRecords.set(record.user_id, existing);
    });

    const employeeStatuses: EmployeeStatus[] = [];
    const newLateIds = new Set<string>();

    userRecords.forEach((userRecs, userId) => {
      userRecs.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

      const firstEntry = userRecs.find((r) => r.record_type === "entrada");
      const lastRecord = userRecs[userRecs.length - 1];
      const lastExit = userRecs.filter((r) => r.record_type === "salida").pop();

      let status: "presente" | "tarde" | "finalizado" | "ausente" = "ausente";

      if (firstEntry) {
        if (lastRecord.record_type === "salida") {
          status = "finalizado";
        } else if (
          isLateForSchedule(
            firstEntry.recorded_at,
            scheduleConfig.entryHour,
            scheduleConfig.entryMinute,
            scheduleConfig.entryToleranceMinutes
          )
        ) {
          status = "tarde";
          newLateIds.add(userId);
        } else {
          status = "presente";
        }
      }

      const profileName =
        firstEntry?.profiles?.full_name ||
        allMembersMap.get(userId)?.full_name ||
        `Usuario ${userId.slice(0, 8)}`;
      const locationName = firstEntry?.locations?.name || "Sin ubicación";

      employeeStatuses.push({
        id: userId,
        user_id: userId,
        name: profileName,
        avatar: firstEntry?.profiles?.avatar_url || allMembersMap.get(userId)?.avatar_url || null,
        entryTime: firstEntry ? formatTime(firstEntry.recorded_at) : null,
        exitTime: lastExit ? formatTime(lastExit.recorded_at) : null,
        status,
        location: locationName,
      });
    });

    // Add absent org members (those with no records today)
    allMembersMap.forEach((profile, memberId) => {
      if (!userRecords.has(memberId)) {
        employeeStatuses.push({
          id: memberId,
          user_id: memberId,
          name: profile.full_name,
          avatar: profile.avatar_url,
          entryTime: null,
          exitTime: null,
          status: "ausente",
          location: "—",
        });
      }
    });

    // Late arrival notifications (skip first load)
    if (!isInitialLoadRef.current) {
      newLateIds.forEach((id) => {
        if (!previousLateIdsRef.current.has(id)) {
          const emp = employeeStatuses.find((e) => e.id === id);
          if (emp) {
            toast({
              title: "Llegada tarde detectada",
              description: `${emp.name} llegó tarde a las ${emp.entryTime}`,
              variant: "destructive",
            });
          }
        }
      });
    }
    isInitialLoadRef.current = false;
    previousLateIdsRef.current = newLateIds;

    setEmployees(employeeStatuses);
  };

  useEffect(() => {
    if (qrDialogOpen && !qrValue) {
      generateQR();
    }
  }, [qrDialogOpen]);

  useEffect(() => {
    if (!qrDialogOpen || !qrValue) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateQR();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrDialogOpen, qrValue]);

  const generateQR = async () => {
    // Use cryptographically secure random generation
    const newCode = `nomia-${crypto.randomUUID()}`;
    setQrValue(newCode);
    setTimeLeft(300);

    // Save to database if we have location
    if (locationId && user) {
      try {
        await supabase.from("qr_codes").insert({
          location_id: locationId,
          code: newCode,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          created_by: user.id,
        });
      } catch (error) {
        console.error("Error saving QR code:", error);
      }
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const presentCount = employees.filter((e) => e.status === "presente").length;
  const lateCount = employees.filter((e) => e.status === "tarde").length;
  const finishedCount = employees.filter((e) => e.status === "finalizado").length;
  const absentCount = employees.filter((e) => e.status === "ausente").length;
  const totalCount = employees.length;

  const filteredEmployees = useMemo(() => {
    if (statusFilter === "todos") return employees;
    return employees.filter((e) => e.status === statusFilter);
  }, [employees, statusFilter]);

  const pieData = useMemo(() => {
    const data = [
      { name: "En Horario", value: presentCount, key: "presente" },
      { name: "Tarde", value: lateCount, key: "tarde" },
      { name: "Ausente", value: absentCount, key: "ausente" },
      { name: "Finalizado", value: finishedCount, key: "finalizado" },
    ].filter((d) => d.value > 0);
    return data;
  }, [presentCount, lateCount, absentCount, finishedCount]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 min-h-16 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Panel de Administrador</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Monitor en vivo de asistencia</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="outline" size="icon" className="sm:hidden" onClick={() => openManualDialog()} aria-label="Registro Manual">
              <ClipboardPen className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => openManualDialog()}>
              <ClipboardPen className="w-4 h-4 mr-2" />
              Registro Manual
            </Button>
            <Link to="/admin/reports">
              <Button variant="outline" size="icon" className="sm:hidden" aria-label="Reportes">
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reportes
              </Button>
            </Link>
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-9 sm:w-9" onClick={fetchTodayAttendance} disabled={isLoadingData} aria-label="Actualizar">
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className={`glass-card cursor-pointer transition-all ${statusFilter === "presente" ? "ring-2 ring-success" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "presente" ? "todos" : "presente")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Horario</p>
                  <p className="text-2xl font-bold">{presentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`glass-card cursor-pointer transition-all ${statusFilter === "tarde" ? "ring-2 ring-warning" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "tarde" ? "todos" : "tarde")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tarde</p>
                  <p className="text-2xl font-bold">{lateCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`glass-card cursor-pointer transition-all ${statusFilter === "ausente" ? "ring-2 ring-destructive" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "ausente" ? "todos" : "ausente")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <UserX className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ausentes</p>
                  <p className="text-2xl font-bold">{absentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`glass-card cursor-pointer transition-all ${statusFilter === "finalizado" ? "ring-2 ring-secondary" : ""}`}
            onClick={() => setStatusFilter(statusFilter === "finalizado" ? "todos" : "finalizado")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finalizados</p>
                  <p className="text-2xl font-bold">{finishedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Chart */}
        {totalCount > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5" />
                Distribución de Asistencia Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ChartContainer config={chartConfig} className="h-[200px] w-full max-w-[250px]">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-muted-foreground">En Horario:</span>
                    <span className="font-semibold">{presentCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning" />
                    <span className="text-muted-foreground">Tarde:</span>
                    <span className="font-semibold">{lateCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-muted-foreground">Ausentes:</span>
                    <span className="font-semibold">{absentCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary" />
                    <span className="text-muted-foreground">Finalizados:</span>
                    <span className="font-semibold">{finishedCount}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t">
                    <span className="text-muted-foreground">Total empleados:</span>
                    <span className="font-bold ml-2">{totalCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Status Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Monitor en Vivo
                  <span className="ml-2 w-2 h-2 rounded-full bg-success animate-pulse" />
                </CardTitle>
                <CardDescription>Estado actual de asistencia de empleados (actualización en tiempo real)</CardDescription>
              </div>
              <div className="overflow-x-auto -mx-2 px-2">
                <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                  <TabsList className="w-auto">
                    <TabsTrigger value="todos" className="text-xs sm:text-sm">Todos <span className="hidden sm:inline ml-1">({totalCount})</span></TabsTrigger>
                    <TabsTrigger value="presente" className="text-xs sm:text-sm"><span className="sm:hidden">Horario</span><span className="hidden sm:inline">En Horario ({presentCount})</span></TabsTrigger>
                    <TabsTrigger value="tarde" className="text-xs sm:text-sm">Tarde <span className="hidden sm:inline ml-1">({lateCount})</span></TabsTrigger>
                    <TabsTrigger value="ausente" className="text-xs sm:text-sm"><span className="sm:hidden">Ausent.</span><span className="hidden sm:inline">Ausentes ({absentCount})</span></TabsTrigger>
                    <TabsTrigger value="finalizado" className="text-xs sm:text-sm">Fin <span className="hidden sm:inline ml-1">({finishedCount})</span></TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {statusFilter !== "todos" ? (
                  <>
                    <p>No hay empleados con estado &quot;{statusFilter}&quot;</p>
                    <Button variant="link" className="mt-2" onClick={() => setStatusFilter("todos")}>
                      Ver todos los empleados
                    </Button>
                  </>
                ) : (
                  <>
                    <p>No hay registros de asistencia hoy</p>
                    <p className="text-sm">Los empleados aparecerán aquí cuando escaneen el código QR</p>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Empleado</TableHead>
                      <TableHead className="font-semibold">Entrada</TableHead>
                      <TableHead className="font-semibold hidden sm:table-cell">Salida</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Local</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={employee.avatar || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{employee.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {employee.entryTime || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono hidden sm:table-cell">
                          {employee.exitTime || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-sm">{employee.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Registrar asistencia manualmente"
                            title="Registrar asistencia manualmente"
                            onClick={() => openManualDialog(employee)}
                          >
                            <ClipboardPen className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Manual Registration Dialog */}
        <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardPen className="w-5 h-5" />
                Registro Manual de Asistencia
              </DialogTitle>
              <DialogDescription>
                Registra manualmente la entrada o salida de un empleado. Útil para correcciones o excepciones.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manual-employee">Empleado</Label>
                <Select value={manualUserId} onValueChange={setManualUserId}>
                  <SelectTrigger id="manual-employee">
                    <SelectValue placeholder="Selecciona un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.user_id} value={emp.user_id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-type">Tipo de registro</Label>
                <Select value={manualRecordType} onValueChange={(v) => setManualRecordType(v as "entrada" | "salida")}>
                  <SelectTrigger id="manual-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <span className="flex items-center gap-2">
                        <LogIn className="w-4 h-4 text-success" />
                        Entrada
                      </span>
                    </SelectItem>
                    <SelectItem value="salida">
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4 text-muted-foreground" />
                        Salida
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-date">Fecha</Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-time">Hora</Label>
                  <Input
                    id="manual-time"
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                  />
                </div>
              </div>

              {locations.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="manual-location">Ubicación</Label>
                  <Select value={manualLocationId} onValueChange={setManualLocationId}>
                    <SelectTrigger id="manual-location">
                      <SelectValue placeholder="Selecciona una ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleManualRecord}
                disabled={isSubmittingManual || !manualUserId || !manualLocationId}
              >
                {isSubmittingManual ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <ClipboardPen className="w-4 h-4" />
                    Registrar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;