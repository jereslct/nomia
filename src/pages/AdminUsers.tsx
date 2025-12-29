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
import { ArrowLeft, UserPlus, Users, Mail, Loader2, Check, Clock, X, Building2, Plus, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface Organization {
  id: string;
  name: string;
  created_at: string;
  member_count?: number;
}

interface OrganizationMember {
  id: string;
  user_id: string | null;
  invited_email: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  accepted_at: string | null;
  organization_id?: string;
  organization_name?: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const emailSchema = z.string().email("Correo electrónico inválido");
const orgNameSchema = z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100);

const getStatusBadge = (status: string) => {
  switch (status) {
    case "accepted":
      return <Badge className="bg-success text-success-foreground">Activo</Badge>;
    case "pending":
      return <Badge variant="outline" className="text-warning border-warning">Pendiente</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rechazado</Badge>;
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

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  
  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgNameError, setOrgNameError] = useState("");

  // Members state
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [allMembers, setAllMembers] = useState<OrganizationMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isLoadingAllMembers, setIsLoadingAllMembers] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showAllEmployees, setShowAllEmployees] = useState(false);

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
      fetchMembers(selectedOrg.id);
    } else {
      setMembers([]);
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (user && isAdmin && showAllEmployees) {
      fetchAllMembers();
    }
  }, [user, isAdmin, showAllEmployees]);

  const fetchOrganizations = async () => {
    if (!user) return;

    try {
      setIsLoadingOrgs(true);
      
      // Get organizations owned by this admin
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("id, name, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get member counts for each organization
      const orgsWithCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          const { count } = await supabase
            .from("organization_members")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", org.id);
          
          return { ...org, member_count: count || 0 };
        })
      );

      setOrganizations(orgsWithCounts);
      
      // Auto-select first org if available
      if (orgsWithCounts.length > 0 && !selectedOrg) {
        setSelectedOrg(orgsWithCounts[0]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    try {
      setIsLoadingMembers(true);

      const { data: membersData, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for accepted members
      const acceptedUserIds = membersData
        ?.filter((m) => m.user_id && m.status === "accepted")
        .map((m) => m.user_id) as string[];

      let profilesMap = new Map<string, { full_name: string; avatar_url: string | null }>();

      if (acceptedUserIds?.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", acceptedUserIds);

        profiles?.forEach((p) => {
          profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
        });
      }

      const membersWithProfiles: OrganizationMember[] = (membersData || []).map((m) => ({
        ...m,
        status: m.status as "pending" | "accepted" | "rejected",
        profile: m.user_id ? profilesMap.get(m.user_id) : null,
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchAllMembers = async () => {
    if (!user) return;

    try {
      setIsLoadingAllMembers(true);

      // Get all organizations
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("owner_id", user.id);

      if (!orgs || orgs.length === 0) {
        setAllMembers([]);
        return;
      }

      const orgMap = new Map<string, string>();
      orgs.forEach((o) => orgMap.set(o.id, o.name));

      // Get all members from all organizations
      const { data: membersData, error } = await supabase
        .from("organization_members")
        .select("*")
        .in("organization_id", orgs.map((o) => o.id))
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for accepted members
      const acceptedUserIds = membersData
        ?.filter((m) => m.user_id && m.status === "accepted")
        .map((m) => m.user_id) as string[];

      let profilesMap = new Map<string, { full_name: string; avatar_url: string | null }>();

      if (acceptedUserIds?.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", acceptedUserIds);

        profiles?.forEach((p) => {
          profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url });
        });
      }

      const membersWithProfiles: OrganizationMember[] = (membersData || []).map((m) => ({
        ...m,
        status: m.status as "pending" | "accepted" | "rejected",
        organization_name: orgMap.get(m.organization_id) || "Desconocida",
        profile: m.user_id ? profilesMap.get(m.user_id) : null,
      }));

      setAllMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error fetching all members:", error);
    } finally {
      setIsLoadingAllMembers(false);
    }
  };

  const handleCreateOrg = async () => {
    setOrgNameError("");
    
    try {
      orgNameSchema.parse(newOrgName);
    } catch {
      setOrgNameError("El nombre debe tener entre 2 y 100 caracteres");
      return;
    }

    if (!user) return;

    setIsCreatingOrg(true);

    try {
      const { data: newOrg, error } = await supabase
        .from("organizations")
        .insert({
          name: newOrgName.trim(),
          owner_id: user.id,
        })
        .select("id, name, created_at")
        .single();

      if (error) throw error;

      const orgWithCount = { ...newOrg, member_count: 0 };
      setOrganizations([orgWithCount, ...organizations]);
      setSelectedOrg(orgWithCount);
      setNewOrgName("");
      setOrgDialogOpen(false);

      toast({
        title: "Organización creada",
        description: `"${newOrg.name}" ha sido creada exitosamente.`,
      });
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la organización.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleInvite = async () => {
    setEmailError("");
    
    try {
      emailSchema.parse(inviteEmail);
    } catch {
      setEmailError("Ingresa un correo electrónico válido");
      return;
    }

    if (!selectedOrg || !user) return;

    setIsInviting(true);

    try {
      // Check if already invited
      const { data: existing } = await supabase
        .from("organization_members")
        .select("id, status")
        .eq("organization_id", selectedOrg.id)
        .eq("invited_email", inviteEmail.toLowerCase())
        .maybeSingle();

      if (existing) {
        toast({
          title: "Usuario ya invitado",
          description: existing.status === "accepted" 
            ? "Este usuario ya es parte de esta organización."
            : "Ya existe una invitación pendiente para este correo.",
          variant: "destructive",
        });
        setIsInviting(false);
        return;
      }

      // Check if user already exists in the system
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", inviteEmail.toLowerCase())
        .maybeSingle();

      // Create invitation
      const { error } = await supabase
        .from("organization_members")
        .insert({
          organization_id: selectedOrg.id,
          invited_email: inviteEmail.toLowerCase(),
          invited_by: user.id,
          user_id: existingProfile?.user_id || null,
          status: existingProfile ? "accepted" : "pending",
          accepted_at: existingProfile ? new Date().toISOString() : null,
        });

      if (error) throw error;

      // Send invitation email for pending invitations
      if (!existingProfile) {
        try {
          const appUrl = window.location.origin;
          const { error: emailError } = await supabase.functions.invoke("send-invitation-email", {
            body: {
              to_email: inviteEmail.toLowerCase(),
              organization_name: selectedOrg.name,
              inviter_name: profile?.full_name || user.email || "Un administrador",
              app_url: appUrl,
            },
          });

          if (emailError) {
            console.error("Error sending invitation email:", emailError);
            // Don't fail the invitation, just log the error
          }
        } catch (emailErr) {
          console.error("Failed to send invitation email:", emailErr);
        }
      }

      toast({
        title: existingProfile ? "Empleado agregado" : "Invitación enviada",
        description: existingProfile 
          ? `${inviteEmail} ha sido agregado a "${selectedOrg.name}".`
          : `Se envió un correo de invitación a ${inviteEmail}.`,
      });

      setInviteEmail("");
      setInviteDialogOpen(false);
      fetchMembers(selectedOrg.id);
      
      // Update member count
      setOrganizations(orgs => 
        orgs.map(o => o.id === selectedOrg.id 
          ? { ...o, member_count: (o.member_count || 0) + 1 } 
          : o
        )
      );
    } catch (error) {
      console.error("Error inviting:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedOrg) return;

    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Miembro eliminado",
        description: "El empleado ha sido removido de la organización.",
      });

      setMembers(members.filter((m) => m.id !== memberId));
      
      // Update member count
      setOrganizations(orgs => 
        orgs.map(o => o.id === selectedOrg.id 
          ? { ...o, member_count: Math.max((o.member_count || 1) - 1, 0) } 
          : o
        )
      );
    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.status === "accepted").length;
  const pendingMembers = members.filter((m) => m.status === "pending").length;

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
              <h1 className="font-bold text-lg">Gestión de Organizaciones</h1>
              <p className="text-xs text-muted-foreground">Administra tus organizaciones y equipos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Organizations Section */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organizaciones
              </CardTitle>
              <CardDescription>Selecciona una organización para ver sus empleados</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={showAllEmployees ? "default" : "outline"} 
                size="sm"
                onClick={() => {
                  setShowAllEmployees(!showAllEmployees);
                  if (!showAllEmployees) {
                    setSelectedOrg(null);
                  }
                }}
              >
                <Users className="w-4 h-4" />
                {showAllEmployees ? "Viendo todos" : "Ver todos los empleados"}
              </Button>
            <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                  Nueva Organización
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Organización</DialogTitle>
                  <DialogDescription>
                    Crea una nueva organización para gestionar un grupo de empleados.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Nombre de la organización</Label>
                    <Input
                      id="orgName"
                      placeholder="Ej: Sucursal Norte"
                      value={newOrgName}
                      onChange={(e) => {
                        setNewOrgName(e.target.value);
                        setOrgNameError("");
                      }}
                    />
                    {orgNameError && <p className="text-sm text-destructive">{orgNameError}</p>}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOrgDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateOrg} disabled={isCreatingOrg || !newOrgName.trim()}>
                    {isCreatingOrg ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Crear
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOrgs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tienes organizaciones</p>
                <p className="text-sm">Crea tu primera organización para comenzar</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setOrgDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Crear Organización
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`p-4 rounded-lg border text-left transition-all hover:border-primary/50 ${
                      selectedOrg?.id === org.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedOrg?.id === org.id ? "bg-primary/20" : "bg-muted"
                        }`}>
                          <Building2 className={`w-5 h-5 ${
                            selectedOrg?.id === org.id ? "text-primary" : "text-muted-foreground"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {org.member_count} {org.member_count === 1 ? "empleado" : "empleados"}
                          </p>
                        </div>
                      </div>
                      {selectedOrg?.id === org.id && (
                        <ChevronRight className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Employees Section */}
        {showAllEmployees && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Todos los Empleados
              </CardTitle>
              <CardDescription>
                Empleados de todas tus organizaciones ({allMembers.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAllMembers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : allMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay empleados en ninguna organización</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Empleado</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Organización</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMembers.map((member) => (
                        <TableRow key={member.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9">
                                <AvatarImage src={member.profile?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                  {getInitials(member.profile?.full_name || member.invited_email.split("@")[0])}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {member.profile?.full_name || member.invited_email.split("@")[0]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {member.invited_email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.organization_name}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(member.created_at).toLocaleDateString("es")}
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

        {/* Members Section - Only show when org is selected */}
        {selectedOrg && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Empleados Activos</p>
                      <p className="text-2xl font-bold">{activeMembers}</p>
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
                      <p className="text-sm text-muted-foreground">Invitaciones Pendientes</p>
                      <p className="text-2xl font-bold">{pendingMembers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Members Table */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Empleados de {selectedOrg.name}
                  </CardTitle>
                  <CardDescription>Lista de empleados e invitaciones</CardDescription>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="sm">
                      <UserPlus className="w-4 h-4" />
                      Invitar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invitar Empleado</DialogTitle>
                      <DialogDescription>
                        Ingresa el correo electrónico del empleado que deseas agregar a "{selectedOrg.name}".
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="empleado@email.com"
                            className="pl-10"
                            value={inviteEmail}
                            onChange={(e) => {
                              setInviteEmail(e.target.value);
                              setEmailError("");
                            }}
                          />
                        </div>
                        {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
                        {isInviting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Enviar Invitación
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay empleados en esta organización</p>
                    <p className="text-sm">Invita a tu primer empleado para comenzar</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setInviteDialogOpen(true)}
                    >
                      <UserPlus className="w-4 h-4" />
                      Invitar Empleado
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Empleado</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold">Fecha</TableHead>
                          <TableHead className="font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9">
                                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                    {getInitials(member.profile?.full_name || member.invited_email.split("@")[0])}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {member.profile?.full_name || member.invited_email.split("@")[0]}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {member.invited_email}
                            </TableCell>
                            <TableCell>{getStatusBadge(member.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(member.created_at).toLocaleDateString("es")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <X className="w-4 h-4" />
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
          </>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;