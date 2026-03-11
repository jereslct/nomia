import { useState } from "react";
import { Link } from "react-router-dom";
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
import {
  ArrowLeft,
  Users,
  TrendingUp,
  ShoppingBag,
  Award,
  Search,
} from "lucide-react";
import { useSalesPerformance } from "@/hooks/useSalesPerformance";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { formatCurrency } from "@/lib/ivaUtils";

function getCurrentMonthRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    dateFrom: firstDay.toISOString().split("T")[0],
    dateTo: lastDay.toISOString().split("T")[0],
  };
}

const Vendedores = () => {
  const { isAdmin } = useAuth();
  const { sellers, categoryMix, loading, fetchPerformance } = useSalesPerformance();
  const [dateFrom, setDateFrom] = useState(() => getCurrentMonthRange().dateFrom);
  const [dateTo, setDateTo] = useState(() => getCurrentMonthRange().dateTo);
  const [hasQueried, setHasQueried] = useState(false);

  const handleConsultar = () => {
    setHasQueried(true);
    fetchPerformance(dateFrom, dateTo);
  };

  const totalVentas = sellers.reduce((acc, s) => acc + s.total_amount, 0);
  const totalTransacciones = sellers.reduce((acc, s) => acc + s.total_sales, 0);
  const ticketPromedioGeneral = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;

  const showEmptyMessage = !hasQueried || (hasQueried && sellers.length === 0 && categoryMix.length === 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.FACTURACION_PANEL}>
              <Button variant="ghost" size="icon" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Vendedores</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Selector de período */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4" />
              Período de consulta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <Button onClick={handleConsultar} disabled={loading}>
                {loading ? "Consultando…" : "Consultar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showEmptyMessage ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">
                Seleccione un período y consulte.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tarjetas de resumen */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Vendedores activos
                  </CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{sellers.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total ventas período
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalVentas)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ticket promedio general
                  </CardTitle>
                  <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(ticketPromedioGeneral)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Ranking de vendedores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Ranking de vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Monto Total</TableHead>
                      <TableHead className="text-right">Ticket Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellers.map((s, idx) => (
                      <TableRow key={s.seller_id}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            {idx === 0 && (
                              <Award className="w-4 h-4 text-amber-500" />
                            )}
                            {s.seller_name}
                            {idx === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Top
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.total_sales}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(s.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(s.avg_ticket)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mix de productos por categoría */}
            <Card>
              <CardHeader>
                <CardTitle>Mix de productos por categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryMix.map((c) => (
                      <TableRow key={c.category_name}>
                        <TableCell>{c.category_name}</TableCell>
                        <TableCell className="text-right">
                          {c.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(c.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default Vendedores;
