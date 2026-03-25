import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileText,
  Loader2,
  Plus,
  Search,
  Stethoscope,
  Baby,
  MoreHorizontal,
  Paperclip,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "@/hooks/useAuth";
import { useAbsences, Absence, AbsenceType, AbsenceStatus } from "@/hooks/useAbsences";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_CONFIG: Record<AbsenceType, { label: string; color: string; icon: React.ElementType }> = {
  unjustified: { label: "Sin justificar", color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
  justified: { label: "Justificada", color: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  medical_certificate: { label: "Certificado médico", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Stethoscope },
  birth_leave: { label: "Licencia nacimiento", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", icon: Baby },
  other_leave: { label: "Otra licencia", color: "bg-muted text-muted-foreground border-border", icon: MoreHorizontal },
};

const STATUS_CONFIG: Record<AbsenceStatus, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  approved: { label: "Aprobada", color: "bg-success/10 text-success border-success/30" },
  rejected: { label: "Rechazada", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

interface OrgMember {
  user_id: string;
  full_name: string;
}

interface OrgOption {
  id: string;
  name: string;
}

const AdminAbsences = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [selectedListOrgId, setSelectedListOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const { absences, loading, organizationId, createAbsence, updateAbsenceStatus, refetch } = useAbsences(undefined, selectedListOrgId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [dialogMembers, setDialogMembers] = useState<OrgMember[]>([]);
  const [loadingDialogMembers, setLoadingDialogMembers] = useState(false);
  const [newAbsence, setNewAbsence] = useState({ user_id: "", date: "", type: "unjustified" as AbsenceType, justification: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(ROUTES.PANEL);
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Fetch all organizations owned by admin
  const fetchOrganizations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    const orgs = data || [];
    setOrganizations(orgs);
    if (orgs.length > 0 && !selectedListOrgId) {
      setSelectedListOrgId(orgs[0].id);
    }
  }, [user, selectedListOrgId]);

  useEffect(() => {
    if (user && isAdmin) fetchOrganizations();
  }, [user, isAdmin, fetchOrganizations]);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) return;
    setLoadingMembers(true);
    try {
      const { data } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("status", "accepted");

      const userIds = data?.map((m) => m.user_id).filter(Boolean) as string[];
      if (!userIds?.length) {
        setMembers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      setMembers(
        (profiles || []).map((p) => ({ user_id: p.user_id, full_name: p.full_name })),
      );
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) fetchMembers();
  }, [organizationId, fetchMembers]);

  // Fetch members for selected org in dialog
  const fetchDialogMembers = useCallback(async (orgId: string) => {
    if (!orgId) { setDialogMembers([]); return; }
    setLoadingDialogMembers(true);
    try {
      const { data } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId)
        .eq("status", "accepted");

      const userIds = data?.map((m) => m.user_id).filter(Boolean) as string[];
      if (!userIds?.length) { setDialogMembers([]); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      setDialogMembers(
        (profiles || []).map((p) => ({ user_id: p.user_id, full_name: p.full_name })),
      );
    } catch (err) {
      console.error("Error fetching dialog members:", err);
    } finally {
      setLoadingDialogMembers(false);
    }
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchDialogMembers(selectedOrgId);
      setNewAbsence((p) => ({ ...p, user_id: "" }));
    }
  }, [selectedOrgId, fetchDialogMembers]);

  const filteredAbsences = useMemo(() => {
    let result = absences;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (a) => a.profiles?.full_name?.toLowerCase().includes(q) || a.user_id.includes(q),
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((a) => a.type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (dateFrom) {
      result = result.filter((a) => a.date >= dateFrom);
    }

    if (dateTo) {
      result = result.filter((a) => a.date <= dateTo);
    }

    return result;
  }, [absences, searchTerm, typeFilter, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    return {
      total: absences.length,
      unjustified: absences.filter((a) => a.type === "unjustified").length,
      justified: absences.filter((a) => a.type === "justified").length,
      medical: absences.filter((a) => a.type === "medical_certificate").length,
      pending: absences.filter((a) => a.status === "pending").length,
    };
  }, [absences]);

  const handleCreateAbsence = async () => {
    if (!newAbsence.user_id || !newAbsence.date || !selectedOrgId) return;
    setSubmitting(true);

    const { error } = await createAbsence({
      user_id: newAbsence.user_id,
      date: newAbsence.date,
      type: newAbsence.type,
      justification: newAbsence.justification || undefined,
      organization_id: selectedOrgId,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Falta registrada", description: "La inasistencia fue registrada correctamente." });
      setCreateDialogOpen(false);
      setNewAbsence({ user_id: "", date: "", type: "unjustified", justification: "" });
      setSelectedOrgId("");
    }
  };

  const handleStatusChange = async (absence: Absence, newStatus: AbsenceStatus) => {
    if (!user) return;

    const { error } = await updateAbsenceStatus({
      id: absence.id,
      status: newStatus,
      reviewed_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({
        title: newStatus === "approved" ? "Aprobada" : "Rechazada",
        description: `La justificación fue ${newStatus === "approved" ? "aprobada" : "rechazada"}.`,
      });
    }
  };

  const exportCSV = () => {
    const headers = ["Empleado", "Fecha", "Tipo", "Estado", "Justificación"];
    const rows = filteredAbsences.map((a) => [
      a.profiles?.full_name || a.user_id,
      a.date,
      TYPE_CONFIG[a.type].label,
      STATUS_CONFIG[a.status].label,
      a.justification || "",
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_faltas_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 min-h-16 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.ADMIN}>
              <Button variant="ghost" size="icon" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Reporte de Faltas</h1>
              <p className="text-xs text-muted-foreground">Gestión de inasistencias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredAbsences.length === 0}>
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button size="sm" onClick={() => {
              if (organizations.length === 1) {
                setSelectedOrgId(organizations[0].id);
                fetchDialogMembers(organizations[0].id);
              }
              setCreateDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Registrar falta</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unjustified}</p>
                <p className="text-xs text-muted-foreground">Sin justificar</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.justified}</p>
                <p className="text-xs text-muted-foreground">Justificadas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.medical}</p>
                <p className="text-xs text-muted-foreground">Certificados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="min-w-[150px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="unjustified">Sin justificar</SelectItem>
                    <SelectItem value="justified">Justificada</SelectItem>
                    <SelectItem value="medical_certificate">Certificado médico</SelectItem>
                    <SelectItem value="birth_leave">Licencia nacimiento</SelectItem>
                    <SelectItem value="other_leave">Otra licencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobada</SelectItem>
                    <SelectItem value="rejected">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Desde" />
              </div>
              <div className="min-w-[140px]">
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="Hasta" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table (desktop) */}
        <div className="hidden md:block">
          <Card className="glass-card">
            <CardContent className="p-0">
              {filteredAbsences.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay faltas registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Empleado</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Tipo</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Justificación</TableHead>
                        <TableHead className="font-semibold text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAbsences.map((absence) => (
                        <TableRow key={absence.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            {absence.profiles?.full_name || absence.user_id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(absence.date + "T12:00:00"), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={TYPE_CONFIG[absence.type].color}>
                              {TYPE_CONFIG[absence.type].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={STATUS_CONFIG[absence.status].color}>
                              {STATUS_CONFIG[absence.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="space-y-1">
                              {absence.justification && (
                                <p className="text-sm truncate">{absence.justification}</p>
                              )}
                              {absence.certificate_file_name && (
                                <a
                                  href={absence.certificate_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {absence.certificate_file_name}
                                </a>
                              )}
                              {!absence.justification && !absence.certificate_file_name && (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {absence.status === "pending" && (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-success hover:text-success hover:bg-success/10"
                                  onClick={() => handleStatusChange(absence, "approved")}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleStatusChange(absence, "rejected")}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </div>
                            )}
                            {absence.status !== "pending" && (
                              <span className="text-xs text-muted-foreground">
                                {absence.reviewed_at && format(new Date(absence.reviewed_at), "dd/MM HH:mm")}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden space-y-3">
          {filteredAbsences.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No hay faltas registradas</p>
              </CardContent>
            </Card>
          ) : (
            filteredAbsences.map((absence) => {
              const typeCfg = TYPE_CONFIG[absence.type];
              const statusCfg = STATUS_CONFIG[absence.status];
              const Icon = typeCfg.icon;

              return (
                <Card key={absence.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeCfg.color.split(" ").slice(0, 1).join(" ")}`}>
                        <Icon className={`w-5 h-5 ${typeCfg.color.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm truncate">
                            {absence.profiles?.full_name || absence.user_id.slice(0, 8)}
                          </p>
                          <Badge variant="outline" className={statusCfg.color}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(absence.date + "T12:00:00"), "EEEE d MMM, yyyy", { locale: es })}
                        </p>
                        <Badge variant="outline" className={typeCfg.color}>
                          {typeCfg.label}
                        </Badge>

                        {absence.justification && (
                          <p className="text-sm text-muted-foreground">{absence.justification}</p>
                        )}

                        {absence.certificate_file_name && (
                          <a
                            href={absence.certificate_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            {absence.certificate_file_name}
                          </a>
                        )}

                        {absence.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success/30 hover:bg-success/10"
                              onClick={() => handleStatusChange(absence, "approved")}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleStatusChange(absence, "rejected")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Create absence dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar falta</DialogTitle>
            <DialogDescription>Registra una inasistencia para un empleado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {organizations.length > 1 && (
              <div className="space-y-2">
                <Label>Organización</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="employee">Empleado</Label>
              <Select
                value={newAbsence.user_id}
                onValueChange={(v) => setNewAbsence((p) => ({ ...p, user_id: v }))}
                disabled={organizations.length > 1 && !selectedOrgId}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder={loadingDialogMembers ? "Cargando..." : "Seleccionar empleado"} />
                </SelectTrigger>
                <SelectContent>
                  {(organizations.length > 1 ? dialogMembers : members).map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-date">Fecha</Label>
              <Input
                id="absence-date"
                type="date"
                value={newAbsence.date}
                onChange={(e) => setNewAbsence((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-type">Tipo</Label>
              <Select value={newAbsence.type} onValueChange={(v) => setNewAbsence((p) => ({ ...p, type: v as AbsenceType }))}>
                <SelectTrigger id="absence-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unjustified">Sin justificar</SelectItem>
                  <SelectItem value="justified">Justificada</SelectItem>
                  <SelectItem value="medical_certificate">Certificado médico</SelectItem>
                  <SelectItem value="birth_leave">Licencia por nacimiento</SelectItem>
                  <SelectItem value="other_leave">Otra licencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-justification">Justificación (opcional)</Label>
              <Textarea
                id="absence-justification"
                placeholder="Motivo de la inasistencia..."
                value={newAbsence.justification}
                onChange={(e) => setNewAbsence((p) => ({ ...p, justification: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAbsence}
                disabled={submitting || !newAbsence.user_id || !newAbsence.date || !selectedOrgId}
              >
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAbsences;
