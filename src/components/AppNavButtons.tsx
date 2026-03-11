import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { Receipt, TrendingUp, QrCode, Lock } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useSubscription } from "@/hooks/useSubscription";

interface AppDef {
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  pathPrefix: string;
}

const APPS: AppDef[] = [
  {
    slug: "nomia",
    label: "Nomia",
    icon: QrCode,
    route: ROUTES.PANEL,
    pathPrefix: "/panel",
  },
  {
    slug: "facturacion",
    label: "Facturación",
    icon: Receipt,
    route: ROUTES.FACTURACION_PANEL,
    pathPrefix: "/facturacion",
  },
  {
    slug: "comercial",
    label: "Comercial",
    icon: TrendingUp,
    route: ROUTES.COMERCIAL_PANEL,
    pathPrefix: "/comercial",
  },
];

export const AppNavButtons = () => {
  const { hasApp } = useSubscription();
  const location = useLocation();

  return (
    <div className="flex items-center gap-1">
      {APPS.map((app) => {
        const isActive = location.pathname.startsWith(app.pathPrefix);
        const isLocked = !hasApp(app.slug);
        const Icon = app.icon;

        if (app.slug === "nomia") return null;

        return (
          <Link key={app.slug} to={isLocked ? "#" : app.route}>
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              disabled={isLocked}
              className={isLocked ? "opacity-50 cursor-not-allowed" : ""}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">{app.label}</span>
              {isLocked && <Lock className="w-3 h-3 ml-1.5" />}
            </Button>
          </Link>
        );
      })}
    </div>
  );
};
