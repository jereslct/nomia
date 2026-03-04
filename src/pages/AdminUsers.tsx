import { useState, useEffect, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, UserPlus, Users, Mail, Loader2, Check, Clock, X, Building2, Plus, ChevronRight, Trash2, Phone, Search, ChevronLeft, Filter, Upload, MoreHorizontal, RefreshCw } from "lucide-react";
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
    phone_number: string | null;
  } | null;
  entryStatus?: "a_tiempo" | "tarde" | "ausente" | null;
}

const emailSchema = z.string().email("Correo electrónico inválido");
const orgNameSchema = z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100);

const getStatusText = (status: string) => {
  switch (status) {
    case "accepted":
      return <span className="text-success font-medium">Aceptada</span>;
    case "pending":
      return <span className="text-warning font-medium">Pendiente</span>;
    case "rejected":
      return <span className="text-destructive font-medium">Rechazada</span>;
    default:
      return <span className="text-muted-foreground">Desconocida</span>;
  }
};

const getEntryStatusBadge = (entryStatus: "a_tiempo" | "tarde" | "ausente" | null | undefined) => {
  if (!entryStatus || entryStatus === "ausente") return <span className="text-muted-foreground/50">Sin registro</span>;
  if (entryStatus === "a_tiempo") return <Badge className="bg-success text-success-foreground">A tiempo</Badge>;
  if (entryStatus === "tarde") return <Badge className="bg-warning text-warning-foreground">Tarde</Badge>;
  return <span className="text-muted-foreground/50">—</span>;
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

  // Search, filter & pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [invitationFilter, setInvitationFilter] = useState<"all" | "accepted" | "pending" | "rejected">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Bulk operations
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [bulkInviteDialogOpen, setBulkInviteDialogOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [isBulkInviting, setIsBulkInviting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkReinviting, setIsBulkReinviting] = useState(false);

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

      let profilesMap = new Map<string, { full_name: string; avatar_url: string | null; phone_number: string | null }>();

      if (acceptedUserIds?.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, phone_number")
          .in("user_id", acceptedUserIds);

        profiles?.forEach((p) => {
          profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url, phone_number: p.phone_number });
        });
      }

      // Fetch today's attendance to determine entry status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let entryStatusMap = new Map<string, "a_tiempo" | "tarde" | "ausente">();

      // Fetch work shift for this org to know start_time and grace
      let shiftStartTime = "09:00";
      let graceMinutes = 15;
      
      const { data: shiftData } = await supabase
        .from("work_shifts")
        .select("start_time, entry_grace_minutes")
        .eq("organization_id", orgId)
        .eq("is_default", true)
        .maybeSingle();

      if (shiftData) {
        shiftStartTime = shiftData.start_time;
        graceMinutes = shiftData.entry_grace_minutes;
      }

      if (acceptedUserIds?.length > 0) {
        const { data: attendanceRecords } = await supabase
          .from("attendance_records")
          .select("user_id, record_type, recorded_at")
          .in("user_id", acceptedUserIds)
          .gte("recorded_at", today.toISOString())
          .lt("recorded_at", tomorrow.toISOString())
          .order("recorded_at", { ascending: true });

        // For each user, find their first "entrada" and compare with shift
        const userFirstEntry = new Map<string, string>();
        attendanceRecords?.forEach((r) => {
          if (r.record_type === "entrada" && !userFirstEntry.has(r.user_id)) {
            userFirstEntry.set(r.user_id, r.recorded_at);
          }
        });

        acceptedUserIds.forEach((userId) => {
          const firstEntry = userFirstEntry.get(userId);
          if (!firstEntry) {
            entryStatusMap.set(userId, "ausente");
          } else {
            const entryDate = new Date(firstEntry);
            const [startH, startM] = shiftStartTime.split(":").map(Number);
            const limitDate = new Date(entryDate);
            limitDate.setHours(startH, startM + graceMinutes, 0, 0);
            entryStatusMap.set(userId, entryDate <= limitDate ? "a_tiempo" : "tarde");
          }
        });
      }

      const membersWithProfiles: OrganizationMember[] = (membersData || []).map((m) => ({
        ...m,
        status: m.status as "pending" | "accepted" | "rejected",
        profile: m.user_id ? profilesMap.get(m.user_id) : null,
        entryStatus: m.user_id ? entryStatusMap.get(m.user_id) ?? null : null,
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

      let profilesMap = new Map<string, { full_name: string; avatar_url: string | null; phone_number: string | null }>();

      if (acceptedUserIds?.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url, phone_number")
          .in("user_id", acceptedUserIds);

        profiles?.forEach((p) => {
          profilesMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url, phone_number: p.phone_number });
        });
      }

      // Fetch today's attendance to determine entry status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let entryStatusMap = new Map<string, "a_tiempo" | "tarde" | "ausente">();

      // Fetch shifts for all orgs
      const { data: shiftsData } = await supabase
        .from("work_shifts")
        .select("organization_id, start_time, entry_grace_minutes")
        .in("organization_id", orgs.map((o) => o.id))
        .eq("is_default", true);

      const shiftMap = new Map<string, { start_time: string; grace: number }>();
      shiftsData?.forEach((s) => shiftMap.set(s.organization_id, { start_time: s.start_time, grace: s.entry_grace_minutes }));

      if (acceptedUserIds?.length > 0) {
        const { data: attendanceRecords } = await supabase
          .from("attendance_records")
          .select("user_id, record_type, recorded_at")
          .in("user_id", acceptedUserIds)
          .gte("recorded_at", today.toISOString())
          .lt("recorded_at", tomorrow.toISOString())
          .order("recorded_at", { ascending: true });

        const userFirstEntry = new Map<string, string>();
        attendanceRecords?.forEach((r) => {
          if (r.record_type === "entrada" && !userFirstEntry.has(r.user_id)) {
            userFirstEntry.set(r.user_id, r.recorded_at);
          }
        });

        // Map user to their org
        const userOrgMap = new Map<string, string>();
        membersData?.forEach((m) => {
          if (m.user_id) userOrgMap.set(m.user_id, m.organization_id);
        });

        acceptedUserIds.forEach((userId) => {
          const firstEntry = userFirstEntry.get(userId);
          if (!firstEntry) {
            entryStatusMap.set(userId, "ausente");
          } else {
            const orgIdForUser = userOrgMap.get(userId);
            const shift = orgIdForUser ? shiftMap.get(orgIdForUser) : null;
            const startTime = shift?.start_time || "09:00";
            const grace = shift?.grace || 15;
            const entryDate = new Date(firstEntry);
            const [startH, startM] = startTime.split(":").map(Number);
            const limitDate = new Date(entryDate);
            limitDate.setHours(startH, startM + grace, 0, 0);
            entryStatusMap.set(userId, entryDate <= limitDate ? "a_tiempo" : "tarde");
          }
        });
      }

      const membersWithProfiles: OrganizationMember[] = (membersData || []).map((m) => ({
        ...m,
        status: m.status as "pending" | "accepted" | "rejected",
        organization_name: orgMap.get(m.organization_id) || "Desconocida",
        profile: m.user_id ? profilesMap.get(m.user_id) : null,
        entryStatus: m.user_id ? entryStatusMap.get(m.user_id) ?? null : null,
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

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${orgName}"? Esta acción eliminará también todos los empleados asociados.`)) {
      return;
    }

    try {
      // First delete all members of the organization
      await supabase
        .from("organization_members")
        .delete()
        .eq("organization_id", orgId);

      // Then delete the organization
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;

      toast({
        title: "Organización eliminada",
        description: `"${orgName}" ha sido eliminada exitosamente.`,
      });

      // Update local state
      setOrganizations(orgs => orgs.filter(o => o.id !== orgId));
      
      // Reset selection if deleted org was selected
      if (selectedOrg?.id === orgId) {
        setSelectedOrg(null);
        setShowAllEmployees(true);
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la organización.",
        variant: "destructive",
      });
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (membersList: OrganizationMember[]) => {
    if (selectedMemberIds.size === membersList.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(membersList.map((m) => m.id)));
    }
  };

  const handleBulkInviteCSV = async () => {
    if (!selectedOrg || !user) return;
    const lines = bulkCsvText.split(/[\n,;]+/).map((l) => l.trim().toLowerCase()).filter(Boolean);
    const validEmails = lines.filter((line) => {
      try { emailSchema.parse(line); return true; } catch { return false; }
    });
    if (validEmails.length === 0) {
      toast({ title: "Error", description: "No se encontraron correos válidos.", variant: "destructive" });
      return;
    }
    setIsBulkInviting(true);
    let successCount = 0;
    let skipCount = 0;
    for (const email of validEmails) {
      const { data: existing } = await supabase
        .from("organization_members")
        .select("id")
        .eq("organization_id", selectedOrg.id)
        .eq("invited_email", email)
        .maybeSingle();
      if (existing) { skipCount++; continue; }
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();
      const { error } = await supabase.from("organization_members").insert({
        organization_id: selectedOrg.id,
        invited_email: email,
        invited_by: user.id,
        user_id: existingProfile?.user_id || null,
        status: existingProfile ? "accepted" : "pending",
        accepted_at: existingProfile ? new Date().toISOString() : null,
      });
      if (!error) {
        successCount++;
        if (!existingProfile) {
          try {
            await supabase.functions.invoke("send-invitation-email", {
              body: { to_email: email, organization_name: selectedOrg.name, inviter_name: profile?.full_name || user.email || "Un administrador", app_url: window.location.origin },
            });
          } catch { /* non-critical */ }
        }
      }
    }
    toast({ title: "Invitación masiva completada", description: `${successCount} invitados, ${skipCount} omitidos (ya existían).` });
    setBulkCsvText("");
    setBulkInviteDialogOpen(false);
    setIsBulkInviting(false);
    fetchMembers(selectedOrg.id);
    fetchOrganizations();
  };

  const handleBulkDelete = async () => {
    if (selectedMemberIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedMemberIds.size} miembro(s)? Esta acción no se puede deshacer.`)) return;
    setIsBulkDeleting(true);
    const ids = Array.from(selectedMemberIds);
    const { error } = await supabase.from("organization_members").delete().in("id", ids);
    if (error) {
      toast({ title: "Error", description: "No se pudieron eliminar algunos miembros.", variant: "destructive" });
    } else {
      toast({ title: "Miembros eliminados", description: `${ids.length} miembro(s) eliminados correctamente.` });
      setMembers((prev) => prev.filter((m) => !selectedMemberIds.has(m.id)));
      setAllMembers((prev) => prev.filter((m) => !selectedMemberIds.has(m.id)));
      setSelectedMemberIds(new Set());
      fetchOrganizations();
    }
    setIsBulkDeleting(false);
  };

  const handleBulkReinvite = async () => {
    const pendingSelected = (showAllEmployees ? allMembers : members).filter(
      (m) => selectedMemberIds.has(m.id) && m.status === "pending"
    );
    if (pendingSelected.length === 0) {
      toast({ title: "Sin pendientes", description: "Selecciona miembros con estado pendiente para reenviar.", variant: "destructive" });
      return;
    }
    setIsBulkReinviting(true);
    let sent = 0;
    for (const member of pendingSelected) {
      const orgName = member.organization_name || selectedOrg?.name || "";
      try {
        await supabase.functions.invoke("send-invitation-email", {
          body: { to_email: member.invited_email, organization_name: orgName, inviter_name: profile?.full_name || user?.email || "Un administrador", app_url: window.location.origin },
        });
        sent++;
      } catch { /* non-critical */ }
    }
    toast({ title: "Reenvío completado", description: `${sent} invitación(es) reenviadas.` });
    setIsBulkReinviting(false);
    setSelectedMemberIds(new Set());
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, invitationFilter, selectedOrg, showAllEmployees]);

  const filterMembers = (list: OrganizationMember[]) => {
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.invited_email.toLowerCase().includes(q) ||
          (m.profile?.full_name || "").toLowerCase().includes(q) ||
          (m.profile?.phone_number || "").includes(q)
      );
    }
    if (invitationFilter !== "all") {
      filtered = filtered.filter((m) => m.status === invitationFilter);
    }
    return filtered;
  };

  const filteredMembers = useMemo(() => filterMembers(showAllEmployees ? allMembers : members), [members, allMembers, searchQuery, invitationFilter, showAllEmployees]);
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const paginatedMembers = useMemo(() => filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [filteredMembers, currentPage]);

  const activeMembers = members.filter((m) => m.status === "accepted").length;
  const pendingMembers = members.filter((m) => m.status === "pending").length;

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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" aria-label="Volver">
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
                {/* All Employees Card */}
                <button
                  onClick={() => {
                    setShowAllEmployees(true);
                    setSelectedOrg(null);
                  }}
                  className={`p-4 rounded-lg border text-left transition-all hover:border-accent/50 ${
                    showAllEmployees 
                      ? "border-accent bg-accent/5 ring-1 ring-accent" 
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        showAllEmployees ? "bg-accent/20" : "bg-muted"
                      }`}>
                        <Users className={`w-5 h-5 ${
                          showAllEmployees ? "text-accent" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">Todos mis empleados</p>
                        <p className="text-xs text-muted-foreground">
                          {organizations.reduce((acc, org) => acc + (org.member_count || 0), 0)} empleados en total
                        </p>
                      </div>
                    </div>
                    {showAllEmployees && (
                      <ChevronRight className="w-4 h-4 text-accent" />
                    )}
                  </div>
                </button>

                {/* Organization Cards */}
                {organizations.map((org) => (
                <div
                  key={org.id}
                  className={`p-4 rounded-lg border text-left transition-all hover:border-primary/50 ${
                    selectedOrg?.id === org.id && !showAllEmployees
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedOrg(org);
                        setShowAllEmployees(false);
                      }}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedOrg?.id === org.id && !showAllEmployees ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <Building2 className={`w-5 h-5 ${
                          selectedOrg?.id === org.id && !showAllEmployees ? "text-primary" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {org.member_count} {org.member_count === 1 ? "empleado" : "empleados"}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {selectedOrg?.id === org.id && !showAllEmployees && (
                        <ChevronRight className="w-4 h-4 text-primary" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrg(org.id, org.name);
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Eliminar organización"
                        aria-label="Eliminar organización"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search & Filter Bar */}
        {(showAllEmployees || selectedOrg) && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar empleados"
              />
            </div>
            <Select value={invitationFilter} onValueChange={(v) => setInvitationFilter(v as typeof invitationFilter)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="accepted">Aceptados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedMemberIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <span className="text-sm font-medium">{selectedMemberIds.size} seleccionado(s)</span>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleBulkReinvite} disabled={isBulkReinviting}>
              {isBulkReinviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Reenviar invitaciones
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Eliminar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMemberIds(new Set())} aria-label="Cerrar">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* All Employees Section */}
        {showAllEmployees && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Todos los Empleados
              </CardTitle>
              <CardDescription>
                Empleados de todas tus organizaciones ({filteredMembers.length} de {allMembers.length} total)
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
              ) : paginatedMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron resultados</p>
                  <p className="text-sm">Intenta con otros términos de búsqueda</p>
                </div>
              ) : (
                <>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={paginatedMembers.length > 0 && paginatedMembers.every((m) => selectedMemberIds.has(m.id))}
                            onCheckedChange={() => toggleSelectAll(paginatedMembers)}
                            aria-label="Seleccionar todos"
                          />
                        </TableHead>
                         <TableHead className="font-semibold">Empleado</TableHead>
                          <TableHead className="font-semibold hidden sm:table-cell">Email</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">Teléfono</TableHead>
                          <TableHead className="font-semibold hidden md:table-cell">Organización</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold hidden sm:table-cell">Solicitud</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMembers.map((member) => (
                        <TableRow key={member.id} className={`hover:bg-muted/30 ${selectedMemberIds.has(member.id) ? "bg-primary/5" : ""}`}>
                          <TableCell>
                            <Checkbox
                              checked={selectedMemberIds.has(member.id)}
                              onCheckedChange={() => toggleMemberSelection(member.id)}
                              aria-label={`Seleccionar ${member.invited_email}`}
                            />
                          </TableCell>
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
                          <TableCell className="text-muted-foreground hidden sm:table-cell">
                            {member.invited_email}
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            {member.profile?.phone_number ? (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {member.profile.phone_number}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{member.organization_name}</Badge>
                          </TableCell>
                          <TableCell>{getEntryStatusBadge(member.entryStatus)}</TableCell>
                          <TableCell className="hidden sm:table-cell">{getStatusText(member.status)}</TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">
                            {new Date(member.created_at).toLocaleDateString("es")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} de {filteredMembers.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} aria-label="Página anterior">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} aria-label="Página siguiente">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                </>
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="truncate">Empleados de {selectedOrg.name}</span>
                  </CardTitle>
                  <CardDescription>Lista de empleados e invitaciones</CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                <Dialog open={bulkInviteDialogOpen} onOpenChange={setBulkInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4" />
                      Invitación masiva
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invitación Masiva</DialogTitle>
                      <DialogDescription>
                        Pega una lista de correos electrónicos separados por comas, punto y coma, o líneas nuevas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Label htmlFor="bulkEmails">Correos electrónicos</Label>
                      <textarea
                        id="bulkEmails"
                        className="w-full h-32 p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={"empleado1@email.com\nempleado2@email.com\nempleado3@email.com"}
                        value={bulkCsvText}
                        onChange={(e) => setBulkCsvText(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {bulkCsvText.split(/[\n,;]+/).filter((l) => l.trim()).length} correo(s) detectados
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBulkInviteDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleBulkInviteCSV} disabled={isBulkInviting || !bulkCsvText.trim()}>
                        {isBulkInviting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <><Upload className="w-4 h-4" /> Invitar a todos</>}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                </div>
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
                ) : paginatedMembers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron resultados</p>
                    <p className="text-sm">Intenta con otros términos de búsqueda</p>
                  </div>
                ) : (
                  <>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={paginatedMembers.length > 0 && paginatedMembers.every((m) => selectedMemberIds.has(m.id))}
                              onCheckedChange={() => toggleSelectAll(paginatedMembers)}
                              aria-label="Seleccionar todos"
                            />
                          </TableHead>
                          <TableHead className="font-semibold">Empleado</TableHead>
                          <TableHead className="font-semibold hidden sm:table-cell">Email</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">Teléfono</TableHead>
                          <TableHead className="font-semibold">Estado</TableHead>
                          <TableHead className="font-semibold hidden sm:table-cell">Solicitud</TableHead>
                          <TableHead className="font-semibold hidden lg:table-cell">Fecha</TableHead>
                          <TableHead className="font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMembers.map((member) => (
                          <TableRow key={member.id} className={`hover:bg-muted/30 ${selectedMemberIds.has(member.id) ? "bg-primary/5" : ""}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedMemberIds.has(member.id)}
                                onCheckedChange={() => toggleMemberSelection(member.id)}
                                aria-label={`Seleccionar ${member.invited_email}`}
                              />
                            </TableCell>
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
                            <TableCell className="text-muted-foreground hidden sm:table-cell">
                              {member.invited_email}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden lg:table-cell">
                              {member.profile?.phone_number ? (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {member.profile.phone_number}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </TableCell>
                            <TableCell>{getEntryStatusBadge(member.entryStatus)}</TableCell>
                            <TableCell className="hidden sm:table-cell">{getStatusText(member.status)}</TableCell>
                            <TableCell className="text-muted-foreground hidden lg:table-cell">
                              {new Date(member.created_at).toLocaleDateString("es")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleRemoveMember(member.id)}
                                aria-label="Eliminar miembro"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} de {filteredMembers.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium">{currentPage} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
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