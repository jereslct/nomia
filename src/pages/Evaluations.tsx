import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ClipboardList, Loader2, Star } from "lucide-react";
import { useEvaluations, PerformanceEvaluation, Criterion } from "@/hooks/useEvaluations";
import { useAuth } from "@/hooks/useAuth";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
};

const scoreColor = (score: number): string => {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-yellow-600";
  return "text-red-600";
};

const scoreBgColor = (score: number): string => {
  if (score >= 8) return "bg-green-50 border-green-200";
  if (score >= 6) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
};

const Evaluations = () => {
  const { loading: authLoading } = useAuth();
  const { evaluations, loading } = useEvaluations();

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
          <h1 className="font-bold text-lg">Mis Evaluaciones</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-4">
        {evaluations.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No tenés evaluaciones compartidas</p>
              <p className="text-sm mt-1">Cuando tu administrador comparta una evaluación, aparecerá aquí</p>
            </CardContent>
          </Card>
        ) : (
          evaluations.map((evaluation: PerformanceEvaluation) => {
            const templateName = evaluation.evaluation_templates?.name || "Evaluación";
            const criteria: Criterion[] = evaluation.evaluation_templates?.criteria || [];
            const overall = evaluation.overall_score ?? 0;

            return (
              <Card key={evaluation.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{templateName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatDate(evaluation.period_start)} — {formatDate(evaluation.period_end)}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${scoreBgColor(overall)}`}
                    >
                      <Star className={`w-5 h-5 ${scoreColor(overall)}`} />
                      <span className={`text-2xl font-bold ${scoreColor(overall)}`}>
                        {overall.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {criteria.length > 0 && (
                    <div className="space-y-2.5">
                      {criteria.map((c) => {
                        const score = evaluation.scores[c.name] ?? 0;
                        return (
                          <div key={c.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{c.name}</span>
                              <span className={`font-medium ${scoreColor(score)}`}>
                                {score}/10
                              </span>
                            </div>
                            <Progress value={score * 10} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {evaluation.comments && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">Comentarios</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {evaluation.comments}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
};

export default Evaluations;
