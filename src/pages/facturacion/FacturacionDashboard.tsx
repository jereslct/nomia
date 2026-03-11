import { useEffect, useState } from "react";
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
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/ivaUtils";

const MENU_ITEMS = [
  { icon: Receipt, label: "Nueva Factura", route: ROUTES.FACTURACION_FACTURAS, description: "Crear comprobantes" },
  { icon: TrendingUp, label: "Ventas", route: ROUTES.FACTURACION_VENTAS, description: "Punto de venta" },
  { icon: ShoppingCart, label: "Compras", route: ROUTES.FACTURACION_COMPRAS, description: "Registrar compras" },
  { icon: Package, label: "Productos", route: ROUTES.FACTURACION_PRODUCTOS, description: "Catálogo de productos" },
  { icon: Warehouse, label: "Stock", route: ROUTES.FACTURACION_STOCK, description: "Control de inventario" },
  { icon: Truck, label: "Proveedores", route: ROUTES.FACTURACION_PROVEEDORES, description: "Gestión de proveedores" },
  { icon: Users, label: "Vendedores", route: ROUTES.FACTURACION_VENDEDORES, description: "Rendimiento de ventas" },
  { icon: BarChart3, label: "Reportes", route: ROUTES.FACTURACION_REPORTES, description: "Análisis y exportación" },
  { icon: Building, label: "AFIP", route: ROUTES.FACTURACION_AFIP, description: "Configuración fiscal" },
  { icon: Calculator, label: "Resumen IVA", route: ROUTES.FACTURACION_IVA, description: "Débito y crédito fiscal" },
];

const FacturacionDashboard = () => {
  const { profile, user, isAdmin } = useAuth();
  const { organizationId } = useOrganizationId();
  const [salesToday, setSalesToday] = useState<number>(0);
  const [purchasesMonth, setPurchasesMonth] = useState<number>(0);
  const [stockAlerts, setStockAlerts] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(true);
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

    const fetchStats = async () => {
      setLoading(true);

      // Ventas del día
      const { data: salesData } = await supabase
        .from("sales")
        .select("total")
        .eq("organization_id", organizationId)
        .eq("date", todayStr);
      const salesTotal = (salesData || []).reduce((acc, row) => acc + (row.total || 0), 0);
      setSalesToday(salesTotal);

      // Compras del mes
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select("total")
        .eq("organization_id", organizationId)
        .gte("date", firstDayOfMonth)
        .lte("date", lastDayOfMonth);
      const purchasesTotal = (purchasesData || []).reduce((acc, row) => acc + (row.total || 0), 0);
      setPurchasesMonth(purchasesTotal);

      // Alertas de stock
      const { data: productsData } = await supabase
        .from("products")
        .select("id, current_stock, min_stock")
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      const alerts = (productsData || []).filter(
        (p) => p.current_stock <= p.min_stock
      ).length;
      setStockAlerts(alerts);

      setLoading(false);
    };

    fetchStats();
  }, [organizationId]);

  const STAT_CARDS = [
    {
      icon: DollarSign,
      label: "Ventas del Día",
      value: loading ? "…" : formatCurrency(salesToday),
      colorClass: "bg-success/10 text-success",
    },
    {
      icon: ShoppingCart,
      label: "Compras del Mes",
      value: loading ? "…" : formatCurrency(purchasesMonth),
      colorClass: "bg-accent/10 text-accent",
    },
    {
      icon: AlertTriangle,
      label: "Alertas de Stock",
      value: loading ? "…" : stockAlerts.toString(),
      colorClass: "bg-warning/10 text-warning",
    },
  ];

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
        {/* Stat cards */}
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
                        <p className="text-sm text-muted-foreground">{item.description}</p>
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
