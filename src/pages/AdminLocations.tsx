import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MapPin, Plus, Loader2, Building2, ChevronRight, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
  organization_id: string | null;
  created_at: string;
  created_by: string;
  qr_count?: number;
  attendance_count?: number;
}

const locationNameSchema = z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100);
const locationAddressSchema = z.string().max(200).optional();

const AdminLocations = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [nameError, setNameError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchOrganizations();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (selectedOrg) {
      fetchLocations(selectedOrg.id);
    } else {
      setLocations([]);
    }
  }, [selectedOrg]);

  const fetchOrganizations = async () => {
    if (!user) return;

    try {
      setIsLoadingOrgs(true);

      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("id, name, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrganizations(orgs || []);

      if ((orgs || []).length > 0 && !selectedOrg) {
        setSelectedOrg(orgs![0]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const fetchLocations = async (orgId: string) => {
    if (!user) return;

    try {
      setIsLoadingLocations(true);

      const { data: locs, error } = await supabase
        .from("locations")
        .select("id, name, address, is_active, organization_id, created_at, created_by")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const locationIds = (locs || []).map((l) => l.id);

      let qrCountMap = new Map<string, number>();
      let attendanceCountMap = new Map<string, number>();

      if (locationIds.length > 0) {
        const { data: qrCounts } = await supabase
          .from("qr_codes")
          .select("location_id")
          .in("location_id", locationIds);

        qrCounts?.forEach((qr) => {
          qrCountMap.set(qr.location_id, (qrCountMap.get(qr.location_id) || 0) + 1);
        });

        const today = new Date().toISOString().split("T")[0];
        const { data: attendanceCounts } = await supabase
          .from("attendance_records")
          .select("location_id")
          .in("location_id", locationIds)
          .gte("recorded_at", `${today}T00:00:00`);

        attendanceCounts?.forEach((a) => {
          attendanceCountMap.set(a.location_id, (attendanceCountMap.get(a.location_id) || 0) + 1);
        });
      }

      const locsWithStats: Location[] = (locs || []).map((l) => ({
        ...l,
        qr_count: qrCountMap.get(l.id) || 0,
        attendance_count: attendanceCountMap.get(l.id) || 0,
      }));

      setLocations(locsWithStats);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormAddress("");
    setNameError("");
  };

  const handleCreateLocation = async () => {
    if (!user || !selectedOrg) return;

    const nameResult = locationNameSchema.safeParse(formName.trim());
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }
    setNameError("");
    setIsSaving(true);

    try {
      const { error } = await supabase.from("locations").insert({
        name: formName.trim(),
        address: formAddress.trim() || null,
        created_by: user.id,
        organization_id: selectedOrg.id,
      });

      if (error) throw error;

      toast({
        title: "Ubicación creada",
        description: `"${formName.trim()}" fue agregada correctamente.`,
      });

      resetForm();
      setCreateDialogOpen(false);
      fetchLocations(selectedOrg.id);
    } catch (error: any) {
      console.error("Error creating location:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear la ubicación.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (location: Location) => {
    setEditingLocation(location);
    setFormName(location.name);
    setFormAddress(location.address || "");
    setNameError("");
    setEditDialogOpen(true);
  };

  const handleEditLocation = async () => {
    if (!editingLocation || !selectedOrg) return;

    const nameResult = locationNameSchema.safeParse(formName.trim());
    if (!nameResult.success) {
      setNameError(nameResult.error.errors[0].message);
      return;
    }
    setNameError("");
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("locations")
        .update({
          name: formName.trim(),
          address: formAddress.trim() || null,
        })
        .eq("id", editingLocation.id);

      if (error) throw error;

      toast({
        title: "Ubicación actualizada",
        description: `"${formName.trim()}" fue actualizada correctamente.`,
      });

      resetForm();
      setEditDialogOpen(false);
      setEditingLocation(null);
      fetchLocations(selectedOrg.id);
    } catch (error: any) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar la ubicación.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (location: Location) => {
    if (!selectedOrg) return;

    try {
      const { error } = await supabase
        .from("locations")
        .update({ is_active: !location.is_active })
        .eq("id", location.id);

      if (error) throw error;

      toast({
        title: location.is_active ? "Ubicación desactivada" : "Ubicación activada",
        description: `"${location.name}" fue ${location.is_active ? "desactivada" : "activada"}.`,
      });

      fetchLocations(selectedOrg.id);
    } catch (error: any) {
      console.error("Error toggling location:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo cambiar el estado.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation || !selectedOrg) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", deletingLocation.id);

      if (error) throw error;

      toast({
        title: "Ubicación eliminada",
        description: `"${deletingLocation.name}" fue eliminada.`,
      });

      setDeleteDialogOpen(false);
      setDeletingLocation(null);
      fetchLocations(selectedOrg.id);
    } catch (error: any) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar. Es posible que tenga registros asociados.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">Gestión de Ubicaciones</h1>
            <p className="text-xs text-muted-foreground">Administra las sedes y oficinas de tu organización</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Organization Selector */}
        {isLoadingOrgs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : organizations.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No tienes organizaciones creadas.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crea una organización primero desde{" "}
                <Link to="/admin/users" className="text-primary underline">
                  Gestión de Usuarios
                </Link>.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {organizations.length > 1 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">Selecciona una organización</Label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {organizations.map((org) => (
                    <Card
                      key={org.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedOrg?.id === org.id
                          ? "ring-2 ring-primary border-primary shadow-md"
                          : "glass-card hover-lift"
                      }`}
                      onClick={() => setSelectedOrg(org)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedOrg?.id === org.id ? "bg-primary/20" : "bg-muted"
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            selectedOrg?.id === org.id ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{org.name}</p>
                        </div>
                        {selectedOrg?.id === org.id && (
                          <ChevronRight className="w-4 h-4 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Locations Section */}
            {selectedOrg && (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 shrink-0" />
                        <span className="truncate">Ubicaciones de {selectedOrg.name}</span>
                      </CardTitle>
                      <CardDescription>
                        {locations.length === 0
                          ? "Aún no hay ubicaciones registradas"
                          : `${locations.length} ubicación${locations.length !== 1 ? "es" : ""} registrada${locations.length !== 1 ? "s" : ""}`}
                      </CardDescription>
                    </div>
                    <Dialog open={createDialogOpen} onOpenChange={(open) => {
                      setCreateDialogOpen(open);
                      if (!open) resetForm();
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="hero" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Nueva ubicación
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Crear nueva ubicación</DialogTitle>
                          <DialogDescription>
                            Agrega una sede u oficina a {selectedOrg.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="loc-name">Nombre *</Label>
                            <Input
                              id="loc-name"
                              placeholder="Ej: Oficina Central, Sucursal Norte..."
                              value={formName}
                              onChange={(e) => {
                                setFormName(e.target.value);
                                setNameError("");
                              }}
                              onKeyDown={(e) => e.key === "Enter" && handleCreateLocation()}
                            />
                            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="loc-address">Dirección</Label>
                            <Input
                              id="loc-address"
                              placeholder="Ej: Av. Principal 123, Ciudad..."
                              value={formAddress}
                              onChange={(e) => setFormAddress(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleCreateLocation()}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetForm(); }}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateLocation} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Crear ubicación
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingLocations ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay ubicaciones registradas</p>
                      <p className="text-sm mt-1">Crea una ubicación para empezar a generar códigos QR</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Nombre</TableHead>
                            <TableHead className="font-semibold hidden sm:table-cell">Dirección</TableHead>
                            <TableHead className="font-semibold">Estado</TableHead>
                            <TableHead className="font-semibold text-center hidden sm:table-cell">Registros hoy</TableHead>
                            <TableHead className="font-semibold text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {locations.map((loc) => (
                            <TableRow key={loc.id} className={`hover:bg-muted/30 ${!loc.is_active ? "opacity-60" : ""}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{loc.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <span className="text-sm text-muted-foreground">
                                  {loc.address || "—"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {loc.is_active ? (
                                  <Badge className="bg-success text-success-foreground hover:bg-success/80">Activa</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactiva</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center hidden sm:table-cell">
                                <span className="text-sm font-mono">{loc.attendance_count || 0}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditDialog(loc)}
                                    title="Editar"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleToggleActive(loc)}
                                    title={loc.is_active ? "Desactivar" : "Activar"}
                                  >
                                    {loc.is_active ? (
                                      <ToggleRight className="w-4 h-4 text-success" />
                                    ) : (
                                      <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setDeletingLocation(loc);
                                      setDeleteDialogOpen(true);
                                    }}
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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
            )}
          </>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          resetForm();
          setEditingLocation(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar ubicación</DialogTitle>
            <DialogDescription>
              Modifica los datos de esta ubicación
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                placeholder="Ej: Oficina Central, Sucursal Norte..."
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setNameError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleEditLocation()}
              />
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Dirección</Label>
              <Input
                id="edit-address"
                placeholder="Ej: Av. Principal 123, Ciudad..."
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditLocation()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); resetForm(); setEditingLocation(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleEditLocation} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar <strong>"{deletingLocation?.name}"</strong>. Esta acción no se puede deshacer.
              {(deletingLocation?.attendance_count ?? 0) > 0 && (
                <span className="block mt-2 text-warning font-medium">
                  Esta ubicación tiene registros de asistencia asociados. Considera desactivarla en lugar de eliminarla.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLocation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLocations;
