import { useState, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Search,
  Receipt,
  Eye,
  XCircle,
  Filter,
  Loader2,
} from "lucide-react";
import { useInvoices, type Invoice, type InvoiceItem } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { formatCurrency } from "@/lib/ivaUtils";
import { useToast } from "@/hooks/use-toast";

const INVOICE_TYPE_LABELS: Record<string, string> = {
  factura_a: "Factura A",
  factura_b: "Factura B",
  factura_c: "Factura C",
  nota_credito: "NC",
  nota_debito: "ND",
  informal: "Informal",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  afip_sent: "Enviada AFIP",
};

const DIRECTION_LABELS: Record<string, string> = {
  emitida: "Emitida",
  recibida: "Recibida",
};

const INVOICE_TYPE_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  factura_a: "default",
  factura_b: "secondary",
  factura_c: "outline",
  nota_credito: "destructive",
  nota_debito: "secondary",
  informal: "outline",
};

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  confirmed: "default",
  cancelled: "destructive",
  afip_sent: "secondary",
};

const Facturas = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const {
    invoices,
    loading,
    fetchInvoices,
    fetchInvoiceItems,
    cancelInvoice,
    refetch,
  } = useInvoices();

  const [direction, setDirection] = useState<string>("all");
  const [invoiceType, setInvoiceType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailItems, setDetailItems] = useState<InvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const filters = useMemo(
    () => ({
      direction: direction === "all" ? undefined : (direction as "emitida" | "recibida"),
      invoiceType: invoiceType === "all" ? undefined : invoiceType,
      status: status === "all" ? undefined : status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [direction, invoiceType, status, dateFrom, dateTo],
  );

  useEffect(() => {
    fetchInvoices(filters);
  }, [fetchInvoices, filters.direction, filters.invoiceType, filters.status, filters.dateFrom, filters.dateTo]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter(
      (inv) =>
        (inv.number?.toLowerCase().includes(q) ?? false) ||
        (inv.client_name?.toLowerCase().includes(q) ?? false),
    );
  }, [invoices, searchQuery]);

  const openDetail = useCallback(
    async (invoice: Invoice) => {
      setSelectedInvoice(invoice);
      setDetailDialogOpen(true);
      setLoadingItems(true);
      setDetailItems([]);
      try {
        const items = await fetchInvoiceItems(invoice.id);
        setDetailItems(items);
      } finally {
        setLoadingItems(false);
      }
    },
    [fetchInvoiceItems],
  );

  const openCancelDialog = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCancelDialogOpen(true);
  }, []);

  const handleCancelInvoice = useCallback(async () => {
    if (!selectedInvoice) return;
    setCancelling(true);
    try {
      const result = await cancelInvoice(selectedInvoice.id);
      if (result?.error) {
        toast({
          title: "Error al anular",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Factura anulada correctamente" });
        setCancelDialogOpen(false);
        setSelectedInvoice(null);
      }
    } finally {
      setCancelling(false);
    }
  }, [selectedInvoice, cancelInvoice, toast]);

  const applyFilters = useCallback(() => {
    fetchInvoices(filters);
  }, [fetchInvoices, filters]);

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
            <h1 className="font-bold text-lg">Facturas</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Filter bar */}
        <Card className="glass-card mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="w-4 h-4" />
                Filtros
              </div>

              <div className="space-y-1.5 min-w-[140px]">
                <Label className="text-xs">Dirección</Label>
                <Select value={direction} onValueChange={setDirection}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="emitida">Emitidas</SelectItem>
                    <SelectItem value="recibida">Recibidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-[140px]">
                <Label className="text-xs">Tipo</Label>
                <Select value={invoiceType} onValueChange={setInvoiceType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="factura_a">Factura A</SelectItem>
                    <SelectItem value="factura_b">Factura B</SelectItem>
                    <SelectItem value="factura_c">Factura C</SelectItem>
                    <SelectItem value="nota_credito">Nota Crédito</SelectItem>
                    <SelectItem value="nota_debito">Nota Débito</SelectItem>
                    <SelectItem value="informal">Informal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-[140px]">
                <Label className="text-xs">Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="afip_sent">AFIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fecha desde</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 w-[150px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Fecha hasta</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-[150px]"
                />
              </div>

              <div className="flex-1 min-w-[200px] space-y-1.5">
                <Label className="text-xs">Buscar por número o cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Número, cliente…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <Button size="sm" variant="outline" className="h-9" onClick={applyFilters}>
                Aplicar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="glass-card">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <span>Cargando facturas…</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Receipt className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-center">No hay facturas que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Fecha</TableHead>
                      <TableHead className="whitespace-nowrap">Tipo</TableHead>
                      <TableHead className="whitespace-nowrap">Dirección</TableHead>
                      <TableHead className="whitespace-nowrap">Número</TableHead>
                      <TableHead className="whitespace-nowrap">Cliente</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Subtotal</TableHead>
                      <TableHead className="whitespace-nowrap text-right">IVA</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Total</TableHead>
                      <TableHead className="whitespace-nowrap">Estado</TableHead>
                      <TableHead className="whitespace-nowrap text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(inv.date).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={INVOICE_TYPE_BADGE[inv.invoice_type] ?? "outline"}>
                            {INVOICE_TYPE_LABELS[inv.invoice_type] ?? inv.invoice_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {DIRECTION_LABELS[inv.direction] ?? inv.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {inv.number ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {inv.client_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(inv.subtotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(inv.iva_amount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(inv.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[inv.status] ?? "outline"}>
                            {STATUS_LABELS[inv.status] ?? inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => openDetail(inv)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </Button>
                            {inv.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-destructive hover:text-destructive"
                                onClick={() => openCancelDialog(inv)}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Anular
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Detalle de factura
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha:</span>{" "}
                  {new Date(selectedInvoice.date).toLocaleDateString("es-AR")}
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  {INVOICE_TYPE_LABELS[selectedInvoice.invoice_type] ?? selectedInvoice.invoice_type}
                </div>
                <div>
                  <span className="text-muted-foreground">Número:</span>{" "}
                  {selectedInvoice.number ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Cliente:</span>{" "}
                  {selectedInvoice.client_name ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Subtotal:</span>{" "}
                  {formatCurrency(selectedInvoice.subtotal)}
                </div>
                <div>
                  <span className="text-muted-foreground">IVA:</span>{" "}
                  {formatCurrency(selectedInvoice.iva_amount)}
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>{" "}
                  <span className="font-semibold">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>{" "}
                  <Badge variant={STATUS_BADGE[selectedInvoice.status] ?? "outline"}>
                    {STATUS_LABELS[selectedInvoice.status] ?? selectedInvoice.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Ítems</h4>
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : detailItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Sin ítems</p>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Precio Unit.</TableHead>
                          <TableHead className="text-right">IVA%</TableHead>
                          <TableHead className="text-right">IVA Monto</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right">{item.iva_rate}%</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.iva_amount)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular factura?</AlertDialogTitle>
            <AlertDialogDescription>
              Se anulará la factura{" "}
              {selectedInvoice?.number ? (
                <strong>{selectedInvoice.number}</strong>
              ) : (
                "seleccionada"
              )}
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelInvoice();
              }}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Anulando…
                </>
              ) : (
                "Anular"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Facturas;
