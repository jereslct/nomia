import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Loader2 } from "lucide-react";

interface AppGuardProps {
  children: React.ReactNode;
  requiredApp: string;
  appName?: string;
}

const PLAN_INFO: Record<string, { planName: string; description: string }> = {
  facturacion: {
    planName: "Gestión",
    description:
      "Facturación, compras, ventas, stock, catálogo, reportes de vendedores y conexión AFIP.",
  },
  comercial: {
    planName: "Completo",
    description:
      "Control de gastos por unidad de negocio, sueldos, rentabilidad y punto de equilibrio.",
  },
};

export const AppGuard = ({ children, requiredApp, appName }: AppGuardProps) => {
  const { hasApp, loading } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasApp(requiredApp)) {
    const info = PLAN_INFO[requiredApp];

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {appName || "Módulo"} no disponible
            </h1>
            <p className="text-muted-foreground">
              Para acceder a esta funcionalidad necesitás el plan{" "}
              <span className="font-semibold text-primary">
                {info?.planName || "superior"}
              </span>
              .
            </p>
          </div>

          {info && (
            <div className="rounded-xl border border-border bg-card p-4 text-left space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">
                  Plan {info.planName}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {info.description}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" disabled>
              Contactar para upgrade
            </Button>
            <Link to={ROUTES.PANEL}>
              <Button variant="ghost" size="sm" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
