import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Palmtree,
  Send,
  X,
} from "lucide-react";
import { useVacations, VacationRequest } from "@/hooks/useVacations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

function countWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  if (endDate < startDate) return 0;

  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
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

const Vacations = () => {
  const { user, loading: authLoading } = useAuth();
  const { balance, requests, loading, requestVacation, cancelRequest } = useVacations();
  const { toast } = useToast();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const daysCount = useMemo(() => countWorkingDays(startDate, endDate), [startDate, endDate]);

  const remaining = (balance?.total_days ?? 0) - (balance?.used_days ?? 0);
  const progressPct = balance && balance.total_days > 0
    ? Math.round((balance.used_days / balance.total_days) * 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || daysCount <= 0) {
      toast({ title: "Error", description: "Seleccioná fechas válidas", variant: "destructive" });
      return;
    }
    if (daysCount > remaining) {
      toast({ title: "Error", description: "No tenés suficientes días disponibles", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await requestVacation({
      startDate,
      endDate,
      daysCount,
      reason: reason.trim() || undefined,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Solicitud enviada", description: "Tu solicitud de vacaciones fue registrada" });
      setStartDate("");
      setEndDate("");
      setReason("");
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await cancelRequest(id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Solicitud cancelada" });
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
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Mis Vacaciones</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-2xl space-y-6">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palmtree className="w-5 h-5 text-primary" />
              Balance {new Date().getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {balance ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{balance.total_days}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">{balance.used_days}</p>
                    <p className="text-xs text-muted-foreground">Usados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{remaining}</p>
                    <p className="text-xs text-muted-foreground">Disponibles</p>
                  </div>
                </div>
                <Progress value={progressPct} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {progressPct}% utilizado
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aún no tenés un balance asignado para este año
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-primary" />
              Nueva solicitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Desde</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">Hasta</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              {daysCount > 0 && (
                <p className="text-sm font-medium text-center">
                  Días hábiles: <span className="text-primary">{daysCount}</span>
                </p>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo de la solicitud..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting || daysCount <= 0}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar solicitud
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold text-base">Mis solicitudes</h2>
          {requests.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Palmtree className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No tenés solicitudes de vacaciones</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((req: VacationRequest) => {
              const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <Card key={req.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {formatDate(req.start_date)} — {formatDate(req.end_date)}
                          </span>
                          <Badge variant="outline" className={config.className}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {req.days_count} día{req.days_count !== 1 ? "s" : ""} hábil{req.days_count !== 1 ? "es" : ""}
                        </p>
                        {req.reason && (
                          <p className="text-sm text-muted-foreground truncate">{req.reason}</p>
                        )}
                        {req.review_notes && (
                          <p className="text-xs text-muted-foreground italic">Nota: {req.review_notes}</p>
                        )}
                      </div>
                      {req.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleCancel(req.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Vacations;
