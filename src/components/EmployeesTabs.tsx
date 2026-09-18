import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { Users, AlertTriangle, FolderOpen, Receipt, Palmtree } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: ROUTES.ADMIN_EMPLEADOS, label: "Listado", icon: Users },
  { to: ROUTES.ADMIN_AUSENCIAS, label: "Faltas", icon: AlertTriangle },
  { to: ROUTES.ADMIN_LEGAJOS, label: "Legajos", icon: FolderOpen },
  { to: ROUTES.ADMIN_RECIBOS, label: "Recibos", icon: Receipt },
  { to: ROUTES.ADMIN_VACACIONES, label: "Vacaciones", icon: Palmtree },
];

export const EmployeesTabs = () => {
  const { pathname } = useLocation();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" aria-label="Secciones de empleados">
      {TABS.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default EmployeesTabs;
