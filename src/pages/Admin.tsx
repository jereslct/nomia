import { useState, useEffect } from "react";
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
import { ArrowLeft, QrCode, RefreshCw, Users, Clock, MapPin, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

const isLate = (entryTime: string): boolean => {
  const entryDate = new Date(entryTime);
  const hours = entryDate.getHours();
  const minutes = entryDate.getMinutes();
  // Late if after 9:00 AM
  return hours > 9 || (hours === 9 && minutes > 0);
};

const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

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
          // Refetch when any change happens
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
      // Get the first organization owned by this user
      const { data: existingOrgs } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      const orgId = existingOrgs?.[0]?.id;

      // Don't auto-create organizations - admin should create them manually
      if (!orgId) return;

      if (orgId) {
        setOrganizationId(orgId);

        // Check for existing location linked to this organization
        const { data: existingLocation } = await supabase
          .from("locations")
          .select("id")
          .eq("created_by", user.id)
          .eq("organization_id", orgId)
          .maybeSingle();

        if (existingLocation) {
          setLocationId(existingLocation.id);
        } else {
          // Update existing location without org or create new one
          const { data: unlinkedLocation } = await supabase
            .from("locations")
            .select("id")
            .eq("created_by", user.id)
            .is("organization_id", null)
            .maybeSingle();

          if (unlinkedLocation) {
            await supabase
              .from("locations")
              .update({ organization_id: orgId })
              .eq("id", unlinkedLocation.id);
            setLocationId(unlinkedLocation.id);
          } else {
            const { data: newLocation } = await supabase
              .from("locations")
              .insert({
                name: "Oficina Central",
                address: "Dirección principal",
                created_by: user.id,
                organization_id: orgId,
              })
              .select("id")
              .single();

            if (newLocation) {
              setLocationId(newLocation.id);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error initializing location:", error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get all attendance records for today
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

      // Fetch profiles separately
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

      // Combine records with profiles
      const recordsWithProfiles = records?.map((r) => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || null,
      })) || [];

      processRecords(recordsWithProfiles as AttendanceRecord[]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const processRecords = (records: AttendanceRecord[]) => {
    // Group records by user
    const userRecords = new Map<string, AttendanceRecord[]>();

    records.forEach((record) => {
      const existing = userRecords.get(record.user_id) || [];
      existing.push(record);
      userRecords.set(record.user_id, existing);
    });

    // Process each user's records
    const employeeStatuses: EmployeeStatus[] = [];

    userRecords.forEach((userRecs, userId) => {
      // Sort by time
      userRecs.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

      const firstEntry = userRecs.find((r) => r.record_type === "entrada");
      const lastRecord = userRecs[userRecs.length - 1];
      const lastExit = userRecs.filter((r) => r.record_type === "salida").pop();

      let status: "presente" | "tarde" | "finalizado" | "ausente" = "ausente";

      if (firstEntry) {
        if (lastRecord.record_type === "salida") {
          status = "finalizado";
        } else if (isLate(firstEntry.recorded_at)) {
          status = "tarde";
        } else {
          status = "presente";
        }
      }

      const profileName = firstEntry?.profiles?.full_name || `Usuario ${userId.slice(0, 8)}`;
      const locationName = firstEntry?.locations?.organizations?.name || firstEntry?.locations?.name || "Oficina";

      employeeStatuses.push({
        id: userId,
        user_id: userId,
        name: profileName,
        avatar: firstEntry?.profiles?.avatar_url || null,
        entryTime: firstEntry ? formatTime(firstEntry.recorded_at) : null,
        exitTime: lastExit ? formatTime(lastExit.recorded_at) : null,
        status,
        location: locationName,
      });
    });

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
          <Button variant="outline" size="sm" onClick={fetchTodayAttendance} disabled={isLoadingData}>
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
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
          <Card className="glass-card">
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
          <Card className="glass-card">
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


        {/* Live Status Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Monitor en Vivo
              <span className="ml-2 w-2 h-2 rounded-full bg-success animate-pulse" />
            </CardTitle>
            <CardDescription>Estado actual de asistencia de empleados (actualización en tiempo real)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay registros de asistencia hoy</p>
                <p className="text-sm">Los empleados aparecerán aquí cuando escaneen el código QR</p>
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
                    {employees.map((employee) => (
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