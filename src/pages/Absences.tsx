import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
  Stethoscope,
  Baby,
  MoreHorizontal,
  Upload,
  Paperclip,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAbsences, Absence, AbsenceType } from "@/hooks/useAbsences";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_CONFIG: Record<AbsenceType, { label: string; color: string; icon: React.ElementType }> = {
  unjustified: { label: "Sin justificar", color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
  justified: { label: "Justificada", color: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  medical_certificate: { label: "Certificado médico", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Stethoscope },
  birth_leave: { label: "Licencia por nacimiento", color: "bg-purple-500/10 text-purple-600 border-purple-500/30", icon: Baby },
  other_leave: { label: "Otra licencia", color: "bg-muted text-muted-foreground border-border", icon: MoreHorizontal },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  approved: { label: "Aprobada", color: "bg-success/10 text-success border-success/30" },
  rejected: { label: "Rechazada", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

type TabFilter = "all" | "unjustified" | "justified" | "certificates";

const Absences = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { absences, loading, organizationId, updateAbsenceJustification, refetch } = useAbsences();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [justifyDialogOpen, setJustifyDialogOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);
  const [justification, setJustification] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const filteredAbsences = useMemo(() => {
    switch (activeTab) {
      case "unjustified":
        return absences.filter((a) => a.type === "unjustified" && !a.justification);
      case "justified":
        return absences.filter((a) => a.type === "justified" || (a.type === "unjustified" && a.justification));
      case "certificates":
        return absences.filter((a) => a.type === "medical_certificate" || a.type === "birth_leave" || a.type === "other_leave");
      default:
        return absences;
    }
  }, [absences, activeTab]);

  const counts = useMemo(() => {
    const c = { unjustified: 0, justified: 0, medical_certificate: 0, birth_leave: 0, other_leave: 0 };
    for (const a of absences) {
      c[a.type]++;
    }
    return c;
  }, [absences]);

  const openJustifyDialog = (absence: Absence) => {
    setSelectedAbsence(absence);
    setJustification(absence.justification || "");
    setCertificateFile(null);
    setJustifyDialogOpen(true);
  };

  const handleSubmitJustification = async () => {
    if (!selectedAbsence || !user || !justification.trim()) return;
    setSubmitting(true);

    try {
      let certificateUrl: string | undefined;
      let certificateFileName: string | undefined;

      if (certificateFile && organizationId) {
        const ext = certificateFile.name.split(".").pop();
        const path = `${organizationId}/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("absence-certificates")
          .upload(path, certificateFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("absence-certificates")
          .getPublicUrl(path);

        certificateUrl = urlData.publicUrl;
        certificateFileName = certificateFile.name;
      }

      const { error } = await updateAbsenceJustification({
        id: selectedAbsence.id,
        justification: justification.trim(),
        certificate_url: certificateUrl,
        certificate_file_name: certificateFileName,
      });

      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
      } else {
        toast({ title: "Justificación enviada", description: "Tu justificación fue registrada correctamente." });
        setJustifyDialogOpen(false);
      }
    } catch (err) {
      console.error("Error submitting justification:", err);
      toast({ title: "Error", description: "No se pudo enviar la justificación", variant: "destructive" });
    } finally {
      setSubmitting(false);
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
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">Mis Faltas</h1>
            <p className="text-xs text-muted-foreground">Registro de inasistencias</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.entries(TYPE_CONFIG) as [AbsenceType, typeof TYPE_CONFIG[AbsenceType]][]).map(
            ([type, cfg]) => {
              const Icon = cfg.icon;
              return (
                <Card key={type} className="glass-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color.split(" ").slice(0, 1).join(" ")}`}>
                      <Icon className={`w-4 h-4 ${cfg.color.split(" ")[1]}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl font-bold">{counts[type]}</p>
                      <p className="text-xs text-muted-foreground truncate">{cfg.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>

        {/* Filter tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unjustified">Sin Justificar</TabsTrigger>
            <TabsTrigger value="justified">Justificadas</TabsTrigger>
            <TabsTrigger value="certificates">Certificados</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredAbsences.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No hay faltas en esta categoría</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredAbsences.map((absence) => {
                  const typeCfg = TYPE_CONFIG[absence.type];
                  const statusCfg = STATUS_CONFIG[absence.status];
                  const Icon = typeCfg.icon;
                  const canJustify =
                    absence.type === "unjustified" &&
                    absence.status !== "approved";

                  return (
                    <Card key={absence.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeCfg.color.split(" ").slice(0, 1).join(" ")}`}>
                            <Icon className={`w-5 h-5 ${typeCfg.color.split(" ")[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="font-semibold text-sm capitalize">
                                {format(new Date(absence.date + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={typeCfg.color}>
                                  {typeCfg.label}
                                </Badge>
                                <Badge variant="outline" className={statusCfg.color}>
                                  {statusCfg.label}
                                </Badge>
                              </div>
                            </div>

                            {absence.justification && (
                              <p className="text-sm text-muted-foreground">{absence.justification}</p>
                            )}

                            {absence.certificate_file_name && (
                              <div className="flex items-center gap-1.5 text-xs text-blue-600">
                                <Paperclip className="w-3.5 h-3.5" />
                                <a
                                  href={absence.certificate_url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline truncate"
                                >
                                  {absence.certificate_file_name}
                                </a>
                              </div>
                            )}

                            {canJustify && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => openJustifyDialog(absence)}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Justificar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Justify dialog */}
      <Dialog open={justifyDialogOpen} onOpenChange={setJustifyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justificar falta</DialogTitle>
            <DialogDescription>
              {selectedAbsence &&
                format(new Date(selectedAbsence.date + "T12:00:00"), "d 'de' MMMM, yyyy", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="justification">Motivo</Label>
              <Textarea
                id="justification"
                placeholder="Describe el motivo de la inasistencia..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificado (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="flex-1"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                />
              </div>
              {certificateFile && (
                <p className="text-xs text-muted-foreground">
                  {certificateFile.name} ({(certificateFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setJustifyDialogOpen(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitJustification} disabled={submitting || !justification.trim()}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Absences;
