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
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ArrowLeft, QrCode, RefreshCw, Users, Clock, MapPin, Loader2, BarChart3, UserX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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

const Admin = () => {
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Panel de Administrador</h1>
              <p className="text-xs text-muted-foreground">Monitor en vivo de asistencia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/reports">
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reportes
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={fetchTodayAttendance} disabled={isLoadingData}>
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
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <TabsList>
                  <TabsTrigger value="todos">Todos ({totalCount})</TabsTrigger>
                  <TabsTrigger value="presente">En Horario ({presentCount})</TabsTrigger>
                  <TabsTrigger value="tarde">Tarde ({lateCount})</TabsTrigger>
                  <TabsTrigger value="ausente">Ausentes ({absentCount})</TabsTrigger>
                  <TabsTrigger value="finalizado">Fin ({finishedCount})</TabsTrigger>
                </TabsList>
              </Tabs>
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
                      <TableHead className="font-semibold">Hora Entrada</TableHead>
                      <TableHead className="font-semibold">Hora Salida</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Local</TableHead>
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
                        <TableCell className="font-mono">
                          {employee.exitTime || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-sm">{employee.location}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;