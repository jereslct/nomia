import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  Plus,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  useEvaluations,
  Criterion,
  EvaluationTemplate,
  PerformanceEvaluation,
} from "@/hooks/useEvaluations";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OrgMember {
  user_id: string;
  full_name: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "bg-gray-100 text-gray-700 border-gray-300" },
  completed: { label: "Completada", className: "bg-blue-100 text-blue-800 border-blue-300" },
  shared: { label: "Compartida", className: "bg-green-100 text-green-800 border-green-300" },
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

const AdminEvaluations = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const {
    templates,
    evaluations,
    loading,
    organizationId,
    createTemplate,
    deleteTemplate,
    createEvaluation,
    updateEvaluation,
    shareEvaluation,
  } = useEvaluations();
  const { toast } = useToast();

  const [members, setMembers] = useState<OrgMember[]>([]);

  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateCriteria, setTemplateCriteria] = useState<Criterion[]>([
    { name: "", weight: 5 },
  ]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [evalDialog, setEvalDialog] = useState(false);
  const [evalTemplateId, setEvalTemplateId] = useState("");
  const [evalUserId, setEvalUserId] = useState("");
  const [evalPeriodStart, setEvalPeriodStart] = useState("");
  const [evalPeriodEnd, setEvalPeriodEnd] = useState("");
  const [savingEval, setSavingEval] = useState(false);

  const [scoreDialog, setScoreDialog] = useState<{ open: boolean; evaluation: PerformanceEvaluation | null }>({
    open: false,
    evaluation: null,
  });
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [editComments, setEditComments] = useState("");
  const [savingScore, setSavingScore] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate(ROUTES.PANEL);
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) return;

    const { data } = await supabase
      .from("organization_members")
      .select("user_id, profiles!organization_members_user_id_fkey(full_name)")
      .eq("organization_id", organizationId)
      .eq("status", "accepted");

    setMembers(
      (data || [])
        .filter((m: Record<string, unknown>) => m.user_id && m.profiles)
        .map((m: Record<string, unknown>) => ({
          user_id: m.user_id as string,
          full_name: (m.profiles as Record<string, string>)?.full_name || "Sin nombre",
        })),
    );
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) fetchMembers();
  }, [organizationId, fetchMembers]);

  const getEmployeeName = (userId: string, evaluation?: PerformanceEvaluation) => {
    if (evaluation?.profiles?.full_name) return evaluation.profiles.full_name;
    return members.find((m) => m.user_id === userId)?.full_name || userId.slice(0, 8);
  };

  const addCriterion = () => setTemplateCriteria([...templateCriteria, { name: "", weight: 5 }]);

  const removeCriterion = (index: number) => {
    if (templateCriteria.length <= 1) return;
    setTemplateCriteria(templateCriteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: string | number) => {
    const updated = [...templateCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateCriteria(updated);
  };

  const handleCreateTemplate = async () => {
    const validCriteria = templateCriteria.filter((c) => c.name.trim());
    if (!templateName.trim() || validCriteria.length === 0) {
      toast({ title: "Error", description: "Completá el nombre y al menos un criterio", variant: "destructive" });
      return;
    }

    setSavingTemplate(true);
    const { error } = await createTemplate({
      name: templateName.trim(),
      criteria: validCriteria,
    });
    setSavingTemplate(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Plantilla creada" });
      setTemplateDialog(false);
      setTemplateName("");
      setTemplateCriteria([{ name: "", weight: 5 }]);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await deleteTemplate(id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Plantilla eliminada" });
    }
  };

  const handleCreateEvaluation = async () => {
    if (!evalTemplateId || !evalUserId || !evalPeriodStart || !evalPeriodEnd) {
      toast({ title: "Error", description: "Completá todos los campos", variant: "destructive" });
      return;
    }

    setSavingEval(true);
    const { error } = await createEvaluation({
      templateId: evalTemplateId,
      userId: evalUserId,
      periodStart: evalPeriodStart,
      periodEnd: evalPeriodEnd,
    });
    setSavingEval(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Evaluación creada" });
      setEvalDialog(false);
      setEvalTemplateId("");
      setEvalUserId("");
      setEvalPeriodStart("");
      setEvalPeriodEnd("");
    }
  };

  const openScoreDialog = (evaluation: PerformanceEvaluation) => {
    setScoreDialog({ open: true, evaluation });
    setEditScores({ ...evaluation.scores });
    setEditComments(evaluation.comments || "");
  };

  const getCriteria = (evaluation: PerformanceEvaluation): Criterion[] => {
    return evaluation.evaluation_templates?.criteria || [];
  };

  const computeOverall = (criteria: Criterion[], scores: Record<string, number>): number => {
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = criteria.reduce((sum, c) => sum + (scores[c.name] || 0) * c.weight, 0);
    return parseFloat((weightedSum / totalWeight).toFixed(2));
  };

  const handleSaveScores = async (markCompleted: boolean) => {
    if (!scoreDialog.evaluation) return;
    const criteria = getCriteria(scoreDialog.evaluation);
    const overall = computeOverall(criteria, editScores);

    setSavingScore(true);
    const { error } = await updateEvaluation({
      id: scoreDialog.evaluation.id,
      scores: editScores,
      overallScore: overall,
      comments: editComments.trim() || undefined,
      status: markCompleted ? "completed" : "draft",
    });
    setSavingScore(false);

    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: markCompleted ? "Evaluación completada" : "Borrador guardado" });
      setScoreDialog({ open: false, evaluation: null });
    }
  };

  const handleShare = async (id: string) => {
    const { error } = await shareEvaluation(id);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Evaluación compartida", description: "El empleado puede ver su evaluación" });
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
          <Link to={ROUTES.ADMIN}>
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg">Evaluaciones de Desempeño</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Plantillas
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              <ClipboardList className="w-4 h-4 mr-2" />
              Evaluaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Plantillas de evaluación</h2>
              <Button size="sm" onClick={() => setTemplateDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Nueva plantilla
              </Button>
            </div>

            {templates.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No hay plantillas creadas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id} className="glass-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardDescription>
                        {template.criteria.length} criterio{template.criteria.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {template.criteria.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{c.name}</span>
                            <span className="text-xs font-mono">peso: {c.weight}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Evaluaciones</h2>
              <Button
                size="sm"
                onClick={() => setEvalDialog(true)}
                disabled={templates.length === 0}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nueva evaluación
              </Button>
            </div>

            {evaluations.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No hay evaluaciones</p>
                  {templates.length === 0 && (
                    <p className="text-sm mt-1">Creá una plantilla primero</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Empleado</TableHead>
                      <TableHead>Plantilla</TableHead>
                      <TableHead className="hidden md:table-cell">Período</TableHead>
                      <TableHead className="text-center">Puntaje</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((evaluation) => {
                      const config = STATUS_CONFIG[evaluation.status] || STATUS_CONFIG.draft;
                      const overall = evaluation.overall_score;
                      return (
                        <TableRow key={evaluation.id}>
                          <TableCell className="font-medium">
                            {getEmployeeName(evaluation.user_id, evaluation)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {evaluation.evaluation_templates?.name || "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(evaluation.period_start)} — {formatDate(evaluation.period_end)}
                          </TableCell>
                          <TableCell className="text-center">
                            {overall != null ? (
                              <span className="font-bold">{overall.toFixed(1)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={config.className}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {evaluation.status !== "shared" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openScoreDialog(evaluation)}
                                  title="Evaluar"
                                >
                                  <Star className="w-4 h-4" />
                                </Button>
                              )}
                              {evaluation.status === "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-600"
                                  onClick={() => handleShare(evaluation.id)}
                                  title="Compartir"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              {evaluation.status === "shared" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openScoreDialog(evaluation)}
                                  title="Ver"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva plantilla de evaluación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ej: Evaluación trimestral"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Criterios</Label>
                <Button variant="outline" size="sm" onClick={addCriterion}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar
                </Button>
              </div>
              {templateCriteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={criterion.name}
                      onChange={(e) => updateCriterion(index, "name", e.target.value)}
                      placeholder="Nombre del criterio"
                      className="h-9"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Peso: {criterion.weight}
                      </span>
                      <Slider
                        value={[criterion.weight]}
                        onValueChange={([v]) => updateCriterion(index, "weight", v)}
                        min={1}
                        max={10}
                        step={1}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  {templateCriteria.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCriterion(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTemplate} disabled={savingTemplate}>
              {savingTemplate && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Crear plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evalDialog} onOpenChange={setEvalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva evaluación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plantilla</Label>
              <Select value={evalTemplateId} onValueChange={setEvalTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plantilla" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Empleado</Label>
              <Select value={evalUserId} onValueChange={setEvalUserId}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Inicio período</Label>
                <Input
                  type="date"
                  value={evalPeriodStart}
                  onChange={(e) => setEvalPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fin período</Label>
                <Input
                  type="date"
                  value={evalPeriodEnd}
                  onChange={(e) => setEvalPeriodEnd(e.target.value)}
                  min={evalPeriodStart}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEvaluation} disabled={savingEval}>
              {savingEval && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Crear evaluación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scoreDialog.open}
        onOpenChange={(open) => {
          if (!open) setScoreDialog({ open: false, evaluation: null });
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {scoreDialog.evaluation?.status === "shared" ? "Ver evaluación" : "Evaluar"}
            </DialogTitle>
          </DialogHeader>
          {scoreDialog.evaluation && (() => {
            const criteria = getCriteria(scoreDialog.evaluation);
            const isReadonly = scoreDialog.evaluation.status === "shared";
            const overall = computeOverall(criteria, editScores);

            return (
              <div className="space-y-5">
                <div className="text-sm space-y-0.5">
                  <p>
                    <span className="font-medium">Empleado:</span>{" "}
                    {getEmployeeName(scoreDialog.evaluation.user_id, scoreDialog.evaluation)}
                  </p>
                  <p>
                    <span className="font-medium">Período:</span>{" "}
                    {formatDate(scoreDialog.evaluation.period_start)} — {formatDate(scoreDialog.evaluation.period_end)}
                  </p>
                </div>

                <div className="space-y-4">
                  {criteria.map((c) => {
                    const value = editScores[c.name] ?? 0;
                    return (
                      <div key={c.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{c.name}</Label>
                          <span className="text-sm font-bold">{value}/10</span>
                        </div>
                        <Slider
                          value={[value]}
                          onValueChange={([v]) => {
                            if (!isReadonly) {
                              setEditScores((prev) => ({ ...prev, [c.name]: v }));
                            }
                          }}
                          min={0}
                          max={10}
                          step={0.5}
                          disabled={isReadonly}
                        />
                        <p className="text-xs text-muted-foreground">Peso: {c.weight}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-muted/50 border">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="text-lg font-bold">{overall.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">/10 promedio ponderado</span>
                </div>

                <div className="space-y-1.5">
                  <Label>Comentarios</Label>
                  <Textarea
                    value={editComments}
                    onChange={(e) => setEditComments(e.target.value)}
                    placeholder="Comentarios sobre el desempeño..."
                    rows={3}
                    disabled={isReadonly}
                  />
                </div>
              </div>
            );
          })()}
          {scoreDialog.evaluation && scoreDialog.evaluation.status !== "shared" && (
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setScoreDialog({ open: false, evaluation: null })}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSaveScores(false)}
                disabled={savingScore}
              >
                {savingScore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Guardar borrador
              </Button>
              <Button onClick={() => handleSaveScores(true)} disabled={savingScore}>
                {savingScore && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Completar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvaluations;
