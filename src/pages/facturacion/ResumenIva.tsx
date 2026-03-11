import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
} from "lucide-react";
import { useIvaReport } from "@/hooks/useIvaReport";
import { useInvoices } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";
import {
  formatCurrency,
  extractIvaFromTotal,
  IVA_RATES,
} from "@/lib/ivaUtils";
import { AppNavButtons } from "@/components/AppNavButtons";
import { supabase } from "@/integrations/supabase/client";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  iva_rate: number;
  iva_amount: number;
  subtotal: number;
};

const ResumenIva = () => {
  const { isAdmin } = useAuth();
  const { summary, loading, fetchIvaSummary } = useIvaReport();
  const { invoices, fetchInvoices } = useInvoices();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [periodFetched, setPeriodFetched] = useState(false);
  const [facturaBItems, setFacturaBItems] = useState<InvoiceItemRow[]>([]);

  const periodStart = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
  const periodEnd = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const handleCalcular = async () => {
    setPeriodFetched(true);
    await Promise.all([
      fetchIvaSummary(periodStart, periodEnd),
      fetchInvoices({ dateFrom: periodStart, dateTo: periodEnd }),
    ]);
  };

  const facturaBEmitidas = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.direction === "emitida" &&
        inv.invoice_type?.toLowerCase().startsWith("factura_b") &&
        inv.status !== "cancelled"
    );
  }, [invoices]);

  useEffect(() => {
    if (facturaBEmitidas.length === 0) {
      setFacturaBItems([]);
      return;
    }
    const ids = facturaBEmitidas.map((i) => i.id);
    supabase
      .from("invoice_items")
      .select("*")
      .in("invoice_id", ids)
      .then(({ data }) => {
        setFacturaBItems((data as unknown as InvoiceItemRow[]) || []);
      });
  }, [facturaBEmitidas]);

  const facturaBByRate = useMemo(() => {
    const rates = [21, 10.5, 27] as const;
    const result: Record<number, { totalFacturado: number; neto: number; ivaProyectado: number }> = {
      21: { totalFacturado: 0, neto: 0, ivaProyectado: 0 },
      10.5: { totalFacturado: 0, neto: 0, ivaProyectado: 0 },
      27: { totalFacturado: 0, neto: 0, ivaProyectado: 0 },
    };
    const validRates = IVA_RATES.filter((r) => r > 0) as readonly number[];
    for (const item of facturaBItems) {
      const rate = item.iva_rate;
      if (!validRates.includes(rate)) continue;
      const lineTotal = item.quantity * item.unit_price;
      const calc = extractIvaFromTotal(lineTotal, rate);
      if (!result[rate]) result[rate] = { totalFacturado: 0, neto: 0, ivaProyectado: 0 };
      result[rate].totalFacturado += calc.total;
      result[rate].neto += calc.neto;
      result[rate].ivaProyectado += calc.iva;
    }
    return result;
  }, [facturaBItems]);

  const detallePorTipo = useMemo(() => {
    const map = new Map<
      string,
      { tipo: string; cantidad: number; subtotal: number; iva: number; total: number }
    >();
    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;
      const tipo = inv.invoice_type || "sin_tipo";
      if (!map.has(tipo)) {
        map.set(tipo, { tipo, cantidad: 0, subtotal: 0, iva: 0, total: 0 });
      }
      const r = map.get(tipo)!;
      r.cantidad += 1;
      r.subtotal += inv.subtotal ?? 0;
      r.iva += inv.iva_amount ?? 0;
      r.total += inv.total ?? 0;
    }
    return Array.from(map.values()).sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [invoices]);

  const tipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      factura_a: "Factura A",
      factura_b: "Factura B",
      factura_c: "Factura C",
      sin_tipo: "Sin tipo",
    };
    return labels[tipo] ?? tipo;
  };

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
            <h1 className="font-bold text-lg">Resumen IVA</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Selector de período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Selector de período
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mes</Label>
              <select
                id="month"
                className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                min={2020}
                max={2030}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value) || selectedYear)}
                className="w-[120px]"
              />
            </div>
            <Button onClick={handleCalcular} disabled={loading}>
              {loading ? "Calculando…" : "Calcular"}
            </Button>
          </CardContent>
        </Card>

        {periodFetched && (
          <>
            {/* Tarjetas de resumen */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                    IVA Débito Fiscal
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                    {summary ? formatCurrency(summary.iva_debito) : formatCurrency(0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    IVA Crédito Fiscal
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                    {summary ? formatCurrency(summary.iva_credito) : formatCurrency(0)}
                  </p>
                </CardContent>
              </Card>

              <Card
                className={
                  summary && summary.iva_a_pagar >= 0
                    ? "border-red-200 bg-red-50/50 dark:bg-red-950/20"
                    : "border-green-200 bg-green-50/50 dark:bg-green-950/20"
                }
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle
                    className={
                      summary && summary.iva_a_pagar >= 0
                        ? "text-sm font-medium text-red-700 dark:text-red-400"
                        : "text-sm font-medium text-green-700 dark:text-green-400"
                    }
                  >
                    IVA a Pagar
                  </CardTitle>
                  {summary && summary.iva_a_pagar >= 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-2xl font-bold ${
                      summary && summary.iva_a_pagar >= 0
                        ? "text-red-800 dark:text-red-300"
                        : "text-green-800 dark:text-green-300"
                    }`}
                  >
                    {summary ? formatCurrency(summary.iva_a_pagar) : formatCurrency(0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* IVA Proyectado en Facturas B */}
            <Card>
              <CardHeader>
                <CardTitle>IVA Proyectado en Facturas B</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Las facturas B tienen IVA embebido. Desglose por alícuota:
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alícuota</TableHead>
                      <TableHead className="text-right">Total Facturado</TableHead>
                      <TableHead className="text-right">Neto</TableHead>
                      <TableHead className="text-right">IVA Proyectado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {([21, 10.5, 27] as const).map((rate) => {
                      const r = facturaBByRate[rate] ?? {
                        totalFacturado: 0,
                        neto: 0,
                        ivaProyectado: 0,
                      };
                      return (
                        <TableRow key={rate}>
                          <TableCell>{rate}%</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(r.totalFacturado)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(r.neto)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(r.ivaProyectado)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Detalle por tipo de comprobante */}
            <Card>
              <CardHeader>
                <CardTitle>Detalle por tipo de comprobante</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">IVA</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detallePorTipo.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No hay comprobantes en el período seleccionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detallePorTipo.map((row) => (
                        <TableRow key={row.tipo}>
                          <TableCell>{tipoLabel(row.tipo)}</TableCell>
                          <TableCell className="text-right">{row.cantidad}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.subtotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.iva)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(row.total)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {!periodFetched && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Seleccione el período</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Elija mes y año y pulse &quot;Calcular&quot; para ver el resumen IVA.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ResumenIva;
