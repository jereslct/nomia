import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useAuth } from "@/hooks/useAuth";
import { useWorkShifts, type WorkShift, type WorkShiftInput } from "@/hooks/useWorkShifts";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const DAY_LABELS: { value: number; short: string; full: string }[] = [
  { value: 1, short: "L", full: "Lunes" },
  { value: 2, short: "M", full: "Martes" },
  { value: 3, short: "X", full: "Miércoles" },
  { value: 4, short: "J", full: "Jueves" },
  { value: 5, short: "V", full: "Viernes" },
  { value: 6, short: "S", full: "Sábado" },
  { value: 0, short: "D", full: "Domingo" },
];

const formatTime = (timeStr: string): string => {
  return timeStr.slice(0, 5);
};

const ensureTimeFormat = (timeStr: string): string => {
  if (timeStr.length === 5) return `${timeStr}:00`;
  return timeStr;
};

const AdminShifts = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { shifts, loading, saving, error, createShift, updateShift, deleteShift, defaultShiftInput, clearError } = useWorkShifts();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [formData, setFormData] = useState<WorkShiftInput>(defaultShiftInput);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<WorkShift | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(ROUTES.PANEL);
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
      clearError();
    }
  }, [error, toast, clearError]);

  const openCreateDialog = () => {
    setEditingShift(null);
    setFormData({
      ...defaultShiftInput,
      is_default: shifts.length === 0,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (shift: WorkShift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      entry_grace_minutes: shift.entry_grace_minutes,
      exit_grace_minutes: shift.exit_grace_minutes,
      active_days: [...shift.active_days],
      is_default: shift.is_default,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (shift: WorkShift) => {
    setShiftToDelete(shift);
    setDeleteDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      active_days: prev.active_days.includes(day)
        ? prev.active_days.filter(d => d !== day)
        : [...prev.active_days, day].sort((a, b) => a - b),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "El nombre del turno es obligatorio", variant: "destructive" });
      return;
    }
    if (formData.active_days.length === 0) {
      toast({ title: "Error", description: "Selecciona al menos un día activo", variant: "destructive" });
      return;
    }

    const input: WorkShiftInput = {
      ...formData,
      start_time: ensureTimeFormat(formData.start_time),
      end_time: ensureTimeFormat(formData.end_time),
    };

    let success: boolean;
    if (editingShift) {
      success = await updateShift(editingShift.id, input);
    } else {
      const result = await createShift(input);
      success = result !== null;
    }

    if (success) {
      toast({ title: editingShift ? "Turno actualizado" : "Turno creado", description: `"${formData.name}" guardado correctamente` });
      setDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!shiftToDelete) return;
    const success = await deleteShift(shiftToDelete.id);
    if (success) {
      toast({ title: "Turno eliminado", description: `"${shiftToDelete.name}" fue eliminado` });
    }
    setDeleteDialogOpen(false);
    setShiftToDelete(null);
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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.PANEL}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Gestión de Turnos</h1>
              <p className="text-xs text-muted-foreground">Configura horarios y días laborables</p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Turno
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {shifts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold mb-2">Sin turnos configurados</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crea tu primer turno para definir los horarios de entrada y salida de tus empleados.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Turno
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {shifts.map(shift => (
              <Card key={shift.id} className="glass-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{shift.name}</h3>
                        {shift.is_default && (
                          <Badge className="bg-primary/10 text-primary border-primary/30">
                            <Star className="w-3 h-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Entrada</p>
                          <p className="font-mono font-semibold text-sm">{formatTime(shift.start_time)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Salida</p>
                          <p className="font-mono font-semibold text-sm">{formatTime(shift.end_time)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Tolerancia entrada</p>
                          <p className="font-mono text-sm">{shift.entry_grace_minutes} min</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Tolerancia salida</p>
                          <p className="font-mono text-sm">{shift.exit_grace_minutes} min</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground mr-1">Días:</span>
                        {DAY_LABELS.map(day => {
                          const isActive = shift.active_days.includes(day.value);
                          return (
                            <span
                              key={day.value}
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                              title={day.full}
                            >
                              {day.short}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(shift)}>
                        <Pencil className="w-4 h-4 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteDialog(shift)}
                        disabled={shift.is_default && shifts.length > 1}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {shifts.length > 0 && (
          <Card className="glass-card border-dashed">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                El turno marcado como <Badge variant="outline" className="mx-1 text-xs"><Star className="w-3 h-3 mr-1" />Principal</Badge> se usa para calcular puntualidad en el panel de administración y reportes.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
            <DialogDescription>
              {editingShift
                ? "Modifica los datos del turno"
                : "Define el nombre, horarios y días laborables del turno"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="shift-name">Nombre del turno</Label>
              <Input
                id="shift-name"
                placeholder="Ej: Turno Mañana, Jornada Completa..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift-start">Hora de entrada</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={formatTime(formData.start_time)}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-end">Hora de salida</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={formatTime(formData.end_time)}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift-entry-grace">Tolerancia entrada (min)</Label>
                <Input
                  id="shift-entry-grace"
                  type="number"
                  min={0}
                  max={120}
                  value={formData.entry_grace_minutes}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) setFormData(prev => ({ ...prev, entry_grace_minutes: n }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Puede llegar hasta {formData.entry_grace_minutes} min después de la hora de entrada.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift-exit-grace">Tolerancia salida (min)</Label>
                <Input
                  id="shift-exit-grace"
                  type="number"
                  min={0}
                  max={180}
                  value={formData.exit_grace_minutes}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) setFormData(prev => ({ ...prev, exit_grace_minutes: n }));
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Puede salir hasta {formData.exit_grace_minutes} min después.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Días laborables</Label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map(day => {
                  const isActive = formData.active_days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium border-2 transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      }`}
                      title={day.full}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Seleccionados: {formData.active_days.length === 0
                  ? "Ninguno"
                  : DAY_LABELS.filter(d => formData.active_days.includes(d.value)).map(d => d.full).join(", ")}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="shift-default" className="cursor-pointer">Turno principal</Label>
                <p className="text-xs text-muted-foreground">
                  Se usará para calcular puntualidad por defecto
                </p>
              </div>
              <Switch
                id="shift-default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editingShift ? "Guardar Cambios" : "Crear Turno"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar turno</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el turno &quot;{shiftToDelete?.name}&quot;?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminShifts;
