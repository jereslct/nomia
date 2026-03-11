import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BarChart3,
  Download,
  Filter,
  AlertTriangle,
  Search,
  DollarSign,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { useAuth } from "@/hooks/useAuth";
import { useSales } from "@/hooks/useSales";
import { useInventory } from "@/hooks/useInventory";
import { formatCurrency } from "@/lib/ivaUtils";
import { exportToCSV, exportToExcel, buildTimestamp } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";

const SALE_CHANNEL_LABELS: Record<string, string> = {
  local_fisico: "Local Físico",
  catalogo: "Catálogo",
  online: "Online",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

type ReportTab = "canal" | "metodo" | "alertas";

const ReportesVentas = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { sales, loading: salesLoading, refetch: refetchSales, organizationId } = useSales();
  const { stockProducts, loading: inventoryLoading } = useInventory();

  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState<ReportTab>("canal");
  const [searchAlertas, setSearchAlertas] = useState("");
  const [hasQueried, setHasQueried] = useState(false);

  useEffect(() => {
    if (organizationId && dateFrom && dateTo) {
      refetchSales(dateFrom, dateTo);
      setHasQueried(true);
    }
  }, [organizationId]);

  const handleConsultar = () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Fechas requeridas",
        description: "Seleccione fecha desde y hasta.",
        variant: "destructive",
      });
      return;
    }
    if (dateFrom > dateTo) {
      toast({
        title: "Rango inválido",
        description: "La fecha desde no puede ser mayor que la fecha hasta.",
        variant: "destructive",
      });
      return;
    }
    setHasQueried(true);
    refetchSales(dateFrom, dateTo);
  };

  const ventasPorCanal = useMemo(() => {
    const groups: Record<string, { cantidad: number; total: number }> = {};
    for (const s of sales) {
      const key = s.sale_channel;
      if (!groups[key]) groups[key] = { cantidad: 0, total: 0 };
      groups[key].cantidad += 1;
      groups[key].total += s.total;
    }
    return Object.entries(groups).map(([canal, data]) => ({
      canal: SALE_CHANNEL_LABELS[canal] ?? canal,
      cantidad: data.cantidad,
      total: data.total,
    }));
  }, [sales]);

  const ventasPorMetodo = useMemo(() => {
    const groups: Record<string, { cantidad: number; total: number }> = {};
    for (const s of sales) {
      const key = s.payment_method;
      if (!groups[key]) groups[key] = { cantidad: 0, total: 0 };
      groups[key].cantidad += 1;
      groups[key].total += s.total;
    }
    return Object.entries(groups).map(([metodo, data]) => ({
      metodo: PAYMENT_METHOD_LABELS[metodo] ?? metodo,
      cantidad: data.cantidad,
      total: data.total,
    }));
  }, [sales]);

  const alertasFaltantes = useMemo(() => {
    const items = stockProducts
      .filter((p) => p.current_stock <= p.min_stock)
      .map((p) => ({
        producto: p.name,
        sku: p.sku ?? "-",
        stockActual: p.current_stock,
        minimo: p.min_stock,
        diferencia: p.min_stock - p.current_stock,
      }));
    if (searchAlertas.trim()) {
      const q = searchAlertas.toLowerCase();
      return items.filter(
        (a) =>
          a.producto.toLowerCase().includes(q) ||
          (a.sku !== "-" && a.sku.toLowerCase().includes(q))
      );
    }
    return items;
  }, [stockProducts, searchAlertas]);

  const totalVentasPeriodo = useMemo(() => sales.reduce((sum, s) => sum + s.total, 0), [sales]);
  const productosEnAlerta = alertasFaltantes.length;

  const canalExportCols = [
    { header: "Canal", accessor: (r: { canal: string }) => r.canal },
    { header: "Cantidad", accessor: (r: { cantidad: number }) => r.cantidad },
    { header: "Total", accessor: (r: { total: number }) => r.total },
  ];

  const metodoExportCols = [
    { header: "Método", accessor: (r: { metodo: string }) => r.metodo },
    { header: "Cantidad", accessor: (r: { cantidad: number }) => r.cantidad },
    { header: "Total", accessor: (r: { total: number }) => r.total },
  ];

  const alertasExportCols = [
    { header: "Producto", accessor: (r: { producto: string }) => r.producto },
    { header: "SKU", accessor: (r: { sku: string }) => r.sku },
    { header: "Stock Actual", accessor: (r: { stockActual: number }) => r.stockActual },
    { header: "Mínimo", accessor: (r: { minimo: number }) => r.minimo },
    { header: "Diferencia", accessor: (r: { diferencia: number }) => r.diferencia },
  ];

  const ts = buildTimestamp();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const handleExportCanalCSV = () => {
    exportToCSV(ventasPorCanal, canalExportCols as any, `ventas_por_canal_${ts}.csv`);
  };
  const handleExportCanalExcel = () => {
    exportToExcel(ventasPorCanal, canalExportCols as any, `ventas_por_canal_${ts}.xlsx`, "Ventas por Canal");
  };

  const handleExportMetodoCSV = () => {
    exportToCSV(ventasPorMetodo, metodoExportCols as any, `ventas_por_metodo_${ts}.csv`);
  };
  const handleExportMetodoExcel = () => {
    exportToExcel(ventasPorMetodo, metodoExportCols as any, `ventas_por_metodo_${ts}.xlsx`, "Ventas por Método");
  };

  const handleExportAlertasCSV = () => {
    exportToCSV(alertasFaltantes, alertasExportCols as any, `alertas_faltantes_${ts}.csv`);
  };
  const handleExportAlertasExcel = () => {
    exportToExcel(alertasFaltantes, alertasExportCols as any, `alertas_faltantes_${ts}.xlsx`, "Alertas");
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.FACTURACION_PANEL}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Reportes de Ventas</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Period selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="dateFrom">Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={handleConsultar} disabled={salesLoading}>
                <Filter className="w-4 h-4 mr-2" />
                Consultar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Summary cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total ventas período</p>
                <p className="text-xl font-semibold">
                  {hasQueried && salesLoading ? "..." : sales.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Monto total</p>
                <p className="text-xl font-semibold">
                  {hasQueried && salesLoading ? "..." : formatCurrency(totalVentasPeriodo)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Productos en alerta</p>
                <p className="text-xl font-semibold">
                  {inventoryLoading ? "..." : productosEnAlerta}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "canal" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("canal")}
          >
            Ventas por Canal
          </Button>
          <Button
            variant={activeTab === "metodo" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("metodo")}
          >
            Ventas por Método de Pago
          </Button>
          <Button
            variant={activeTab === "alertas" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("alertas")}
          >
            Alertas de Faltantes
          </Button>
        </div>

        {/* Tab: Ventas por Canal */}
        {activeTab === "canal" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Ventas por Canal
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCanalCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCanalExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salesLoading && hasQueried ? (
                <p className="text-muted-foreground py-8 text-center">Cargando...</p>
              ) : ventasPorCanal.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">Sin datos para el período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasPorCanal.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.canal}</TableCell>
                        <TableCell className="text-right">{row.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Ventas por Método de Pago */}
        {activeTab === "metodo" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Ventas por Método de Pago
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportMetodoCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportMetodoExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {salesLoading && hasQueried ? (
                <p className="text-muted-foreground py-8 text-center">Cargando...</p>
              ) : ventasPorMetodo.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">Sin datos para el período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventasPorMetodo.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.metodo}</TableCell>
                        <TableCell className="text-right">{row.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Alertas de Faltantes */}
        {activeTab === "alertas" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alertas de Faltantes
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportAlertasCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportAlertasExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto o SKU..."
                    value={searchAlertas}
                    onChange={(e) => setSearchAlertas(e.target.value)}
                    className="pl-9 max-w-sm"
                  />
                </div>
              </div>
              {inventoryLoading ? (
                <p className="text-muted-foreground py-8 text-center">Cargando...</p>
              ) : alertasFaltantes.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No hay productos con stock por debajo del mínimo.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Stock Actual</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertasFaltantes.map((row, i) => (
                      <TableRow
                        key={i}
                        className="bg-destructive/5 hover:bg-destructive/10"
                      >
                        <TableCell className="font-medium">{row.producto}</TableCell>
                        <TableCell>{row.sku}</TableCell>
                        <TableCell className="text-right">{row.stockActual}</TableCell>
                        <TableCell className="text-right">{row.minimo}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{row.diferencia}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ReportesVentas;
