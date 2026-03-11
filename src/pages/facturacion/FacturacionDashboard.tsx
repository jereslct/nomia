import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Receipt,
  TrendingUp,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Users,
  BarChart3,
  Building,
  Calculator,
  ChevronRight,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { useAuth } from "@/hooks/useAuth";

const MENU_ITEMS = [
  { icon: Receipt, label: "Nueva Factura", route: ROUTES.FACTURACION_FACTURAS },
  { icon: TrendingUp, label: "Ventas", route: ROUTES.FACTURACION_VENTAS },
  { icon: ShoppingCart, label: "Compras", route: ROUTES.FACTURACION_COMPRAS },
  { icon: Package, label: "Productos", route: ROUTES.FACTURACION_PRODUCTOS },
  { icon: Warehouse, label: "Stock", route: ROUTES.FACTURACION_STOCK },
  { icon: Truck, label: "Proveedores", route: ROUTES.FACTURACION_PROVEEDORES },
  { icon: Users, label: "Vendedores", route: ROUTES.FACTURACION_VENDEDORES },
  { icon: BarChart3, label: "Reportes", route: ROUTES.FACTURACION_REPORTES },
  { icon: Building, label: "AFIP", route: ROUTES.FACTURACION_AFIP },
  { icon: Calculator, label: "Resumen IVA", route: ROUTES.FACTURACION_IVA },
];

const STAT_CARDS = [
  {
    icon: DollarSign,
    label: "Ventas del Día",
    value: "—",
    colorClass: "bg-success/10 text-success",
  },
  {
    icon: ShoppingCart,
    label: "Compras del Mes",
    value: "—",
    colorClass: "bg-accent/10 text-accent",
  },
  {
    icon: AlertTriangle,
    label: "Alertas de Stock",
    value: "—",
    colorClass: "bg-warning/10 text-warning",
  },
];

const FacturacionDashboard = () => {
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
            <h1 className="font-bold text-lg">Facturación</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && <AppNavButtons />}
            {profile && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{profile.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Stat placeholder cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="glass-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.colorClass}`}>
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

        {/* Menu grid - links to sub-pages */}
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

export default FacturacionDashboard;
