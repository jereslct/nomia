import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Loader2,
  Palmtree,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useVacations, VacationRequest } from "@/hooks/useVacations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OrgMember {
  user_id: string;
  full_name: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  approved: { label: "Aprobada", className: "bg-green-100 text-green-800 border-green-300" },
  rejected: { label: "Rechazada", className: "bg-red-100 text-red-800 border-red-300" },
  cancelled: { label: "Cancelada", className: "bg-gray-100 text-gray-600 border-gray-300" },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

const AdminVacations = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { requests, loading, organizationId, reviewRequest, updateBalance, refetch } = useVacations();
  const { toast } = useToast();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; request: VacationRequest | null; action: "approved" | "rejected" }>({
    open: false,
    request: null,
    action: "approved",
  });
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  const [balanceUserId, setBalanceUserId] = useState("");
  const [balanceDays, setBalanceDays] = useState("");
  const [savingBalance, setSavingBalance] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(ROUTES.PANEL);
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) return;
    setLoadingMembers(true);

    const { data } = await supabase
      .from("organization_members")
      .select("user_id, profiles!organization_members_user_id_fkey(full_name)")
      .eq("organization_id", organizationId)
      .eq("status", "accepted");

    const list: OrgMember[] = (data || [])
      .filter((m: Record<string, unknown>) => m.user_id && m.profiles)
      .map((m: Record<string, unknown>) => ({
        user_id: m.user_id as string,
        full_name: (m.profiles as Record<string, string>)?.full_name || "Sin nombre",
      }));

    setMembers(list);
    setLoadingMembers(false);
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) fetchMembers();
  }, [organizationId, fetchMembers]);

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests],
  );

  const approvedThisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return requests.filter(
      (r) =>
        r.status === "approved" &&
        r.reviewed_at &&
        new Date(r.reviewed_at).getMonth() === month &&
        new Date(r.reviewed_at).getFullYear() === year,
    ).length;
  }, [requests]);

  const totalDaysUsed = useMemo(
    () =>
      requests
        .filter((r) => r.status === "approved")
        .reduce((sum, r) => sum + r.days_count, 0),
    [requests],
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (employeeFilter !== "all" && r.user_id !== employeeFilter) return false;
      return true;
    });
  }, [requests, statusFilter, employeeFilter]);

  const getEmployeeName = (userId: string, req?: VacationRequest) => {
    if (req?.profiles?.full_name) return req.profiles.full_name;
    return members.find((m) => m.user_id === userId)?.full_name || userId.slice(0, 8);
  };

  const openReviewDialog = (request: VacationRequest, action: "approved" | "rejected") => {
    setReviewDialog({ open: true, request, action });
    setReviewNotes("");
  };

  const handleReview = async () => {
    if (!reviewDialog.request) return;
    setReviewing(true);

    const { error } = await reviewRequest({
      id: reviewDialog.request.id,
      status: reviewDialog.action,
      reviewNotes: reviewNotes.trim() || undefined,
    });

    setReviewing(false);
    setReviewDialog({ open: false, request: null, action: "approved" });

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({
        title: reviewDialog.action === "approved" ? "Solicitud aprobada" : "Solicitud rechazada",
      });
    }
  };

  const handleSaveBalance = async () => {
    if (!balanceUserId || !balanceDays) return;
    setSavingBalance(true);

    const { error } = await updateBalance({
      userId: balanceUserId,
      year: new Date().getFullYear(),
      totalDays: parseInt(balanceDays, 10),
    });

    setSavingBalance(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Balance actualizado" });
      setBalanceUserId("");
      setBalanceDays("");
    }
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
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <Link to={ROUTES.PANEL}>
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Vacaciones</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Aprobadas (mes)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDaysUsed}</p>
                  <p className="text-xs text-muted-foreground">Días usados (total)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {pendingRequests.length > 0 && (
          <Card className="glass-card border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-yellow-600" />
                Solicitudes pendientes ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-sm">{getEmployeeName(req.user_id, req)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(req.start_date)} — {formatDate(req.end_date)} ({req.days_count} día{req.days_count !== 1 ? "s" : ""})
                    </p>
                    {req.reason && (
                      <p className="text-xs text-muted-foreground truncate">{req.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-50"
                      onClick={() => openReviewDialog(req, "approved")}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-700 border-red-300 hover:bg-red-50"
                      onClick={() => openReviewDialog(req, "rejected")}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palmtree className="w-5 h-5 text-primary" />
              Todas las solicitudes
            </CardTitle>
            <CardDescription>
              {filteredRequests.length} solicitud{filteredRequests.length !== 1 ? "es" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[160px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobada</SelectItem>
                    <SelectItem value="rejected">Rechazada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[180px]">
                <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los empleados</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Palmtree className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No hay solicitudes</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Empleado</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead className="text-center">Días</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => {
                      const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                      return (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">
                            {getEmployeeName(req.user_id, req)}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(req.start_date)} — {formatDate(req.end_date)}
                          </TableCell>
                          <TableCell className="text-center">{req.days_count}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={config.className}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                            {req.reason || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-5 h-5 text-primary" />
              Gestionar balance de vacaciones
            </CardTitle>
            <CardDescription>Asigná los días totales de vacaciones por empleado para el año actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <Label>Empleado</Label>
                <Select value={balanceUserId} onValueChange={setBalanceUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-32 space-y-1.5">
                <Label>Días totales</Label>
                <Input
                  type="number"
                  min={0}
                  value={balanceDays}
                  onChange={(e) => setBalanceDays(e.target.value)}
                  placeholder="Ej: 14"
                />
              </div>
              <Button
                onClick={handleSaveBalance}
                disabled={!balanceUserId || !balanceDays || savingBalance}
                className="w-full sm:w-auto"
              >
                {savingBalance ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={reviewDialog.open}
        onOpenChange={(open) => {
          if (!open) setReviewDialog({ open: false, request: null, action: "approved" });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === "approved" ? "Aprobar solicitud" : "Rechazar solicitud"}
            </DialogTitle>
          </DialogHeader>
          {reviewDialog.request && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Empleado:</span>{" "}
                  {getEmployeeName(reviewDialog.request.user_id, reviewDialog.request)}
                </p>
                <p>
                  <span className="font-medium">Período:</span>{" "}
                  {formatDate(reviewDialog.request.start_date)} — {formatDate(reviewDialog.request.end_date)}
                </p>
                <p>
                  <span className="font-medium">Días:</span> {reviewDialog.request.days_count}
                </p>
                {reviewDialog.request.reason && (
                  <p>
                    <span className="font-medium">Motivo:</span> {reviewDialog.request.reason}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Agregar una nota..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ open: false, request: null, action: "approved" })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewing}
              variant={reviewDialog.action === "approved" ? "default" : "destructive"}
            >
              {reviewing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {reviewDialog.action === "approved" ? "Aprobar" : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVacations;
