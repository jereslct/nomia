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
import { ArrowLeft, UserPlus, Users, Mail, Loader2, Check, Clock, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface OrganizationMember {
  id: string;
  user_id: string | null;
  invited_email: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  accepted_at: string | null;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const emailSchema = z.string().email("Correo electrónico inválido");

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
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchOrganizationAndMembers();
    }
  }, [user, isAdmin]);

  const fetchOrganizationAndMembers = async () => {
    if (!user) return;

    try {
      // Get organization
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!org) {
        setIsLoadingData(false);
        return;
      }

      setOrganizationId(org.id);

      // Get members
      const { data: membersData, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", org.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching members:", error);
        setIsLoadingData(false);
        return;
      }

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

      // Combine members with profiles
      const membersWithProfiles: OrganizationMember[] = (membersData || []).map((m) => ({
        ...m,
        status: m.status as "pending" | "accepted" | "rejected",
        profile: m.user_id ? profilesMap.get(m.user_id) : null,
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoadingData(false);
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

    if (!organizationId || !user) return;

    setIsInviting(true);

    try {
      // Check if already invited
      const { data: existing } = await supabase
        .from("organization_members")
        .select("id, status")
        .eq("organization_id", organizationId)
        .eq("invited_email", inviteEmail.toLowerCase())
        .maybeSingle();

      if (existing) {
        toast({
          title: "Usuario ya invitado",
          description: existing.status === "accepted" 
            ? "Este usuario ya es parte de tu organización."
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
          organization_id: organizationId,
          invited_email: inviteEmail.toLowerCase(),
          invited_by: user.id,
          user_id: existingProfile?.user_id || null,
          status: existingProfile ? "accepted" : "pending",
          accepted_at: existingProfile ? new Date().toISOString() : null,
        });

      if (error) throw error;

      toast({
        title: existingProfile ? "Empleado agregado" : "Invitación enviada",
        description: existingProfile 
          ? `${inviteEmail} ha sido agregado a tu organización.`
          : `Cuando ${inviteEmail} se registre, será agregado automáticamente.`,
      });

      setInviteEmail("");
      setInviteDialogOpen(false);
      fetchOrganizationAndMembers();
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
              <h1 className="font-bold text-lg">Gestión de Empleados</h1>
              <p className="text-xs text-muted-foreground">Invita y administra tu equipo</p>
            </div>
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
                  Ingresa el correo electrónico del empleado que deseas agregar a tu organización.
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Equipo
            </CardTitle>
            <CardDescription>Lista de empleados y invitaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay empleados en tu organización</p>
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
      </main>
    </div>
  );
};

export default AdminUsers;