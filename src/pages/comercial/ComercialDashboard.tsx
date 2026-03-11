import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Receipt,
  Wallet,
  FileSpreadsheet,
  Banknote,
  Building2,
  TrendingUp,
  Target,
  BarChart3,
  ChevronRight,
  DollarSign,
  Percent,
  Crosshair,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { useAuth } from "@/hooks/useAuth";

const STAT_CARDS = [
  {
    icon: DollarSign,
    label: "Ventas Totales",
    value: "—",
    colorClass: "bg-success/10 text-success",
  },
  {
    icon: Wallet,
    label: "Gastos Totales",
    value: "—",
    colorClass: "bg-accent/10 text-accent",
  },
  {
    icon: Percent,
    label: "Rentabilidad",
    value: "—",
    colorClass: "bg-primary/10 text-primary",
  },
  {
    icon: Crosshair,
    label: "Punto de Equilibrio",
    value: "—",
    colorClass: "bg-warning/10 text-warning",
  },
];

const MENU_ITEMS = [
  { icon: Wallet, label: "Gastos", route: ROUTES.COMERCIAL_GASTOS },
  { icon: FileSpreadsheet, label: "Planilla de Gastos", route: ROUTES.COMERCIAL_PLANILLA },
  { icon: Banknote, label: "Sueldos", route: ROUTES.COMERCIAL_SUELDOS },
  { icon: Building2, label: "Unidades de Negocio", route: ROUTES.COMERCIAL_UNIDADES },
  { icon: TrendingUp, label: "Rentabilidad", route: ROUTES.COMERCIAL_RENTABILIDAD },
  { icon: Target, label: "Punto de Equilibrio", route: ROUTES.COMERCIAL_EQUILIBRIO },
  { icon: BarChart3, label: "Reportes", route: ROUTES.COMERCIAL_REPORTES },
];

const ComercialDashboard = () => {
  const { profile, user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.PANEL}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-bold text-lg">Control Comercial</h1>
                <p className="text-xs text-muted-foreground">Panel Comercial</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && <AppNavButtons />}
            {profile && (
              <Link
                to={ROUTES.PERFIL}
                className="text-right hidden sm:block hover:opacity-80 transition-opacity"
              >
                <p className="text-sm font-medium">{profile.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Stat placeholder cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="glass-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.colorClass}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-semibold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick action cards grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Accesos rápidos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.route} to={item.route}>
                  <Card className="glass-card hover-lift cursor-pointer group h-full">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.label}</h3>
                        <p className="text-sm text-muted-foreground">Próximamente</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ComercialDashboard;
