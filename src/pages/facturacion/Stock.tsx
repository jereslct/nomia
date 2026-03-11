import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Warehouse,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { useAuth } from "@/hooks/useAuth";
import { useInventory, type ProductStock, type StockMovement } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";

type StatusFilter = "all" | "critical" | "low" | "ok";

const MOVEMENT_LABELS: Record<string, string> = {
  compra: "Compra",
  venta: "Venta",
  ajuste_positivo: "Ajuste +",
  ajuste_negativo: "Ajuste −",
  devolucion: "Devolución",
};

const Stock = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { stockProducts, movements, loading, createAdjustment, fetchMovements } = useInventory();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<ProductStock | null>(null);
  const [adjustType, setAdjustType] = useState<"ajuste_positivo" | "ajuste_negativo">("ajuste_positivo");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movProduct, setMovProduct] = useState<ProductStock | null>(null);
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const filtered = useMemo(() => {
    let items = stockProducts;
    if (statusFilter !== "all") {
      items = items.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return items;
  }, [stockProducts, search, statusFilter]);

  const counts = useMemo(() => {
    let critical = 0;
    let low = 0;
    let ok = 0;
    for (const p of stockProducts) {
      if (p.status === "critical") critical++;
      else if (p.status === "low") low++;
      else ok++;
    }
    return { total: stockProducts.length, critical, low, ok };
  }, [stockProducts]);

  const openAdjustDialog = (product: ProductStock) => {
    setAdjustProduct(product);
    setAdjustType("ajuste_positivo");
    setAdjustQty("");
    setAdjustNotes("");
    setAdjustDialogOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!adjustProduct) return;
    const qty = Number(adjustQty);
    if (!qty || qty <= 0) {
      toast({ title: "Error", description: "Ingresá una cantidad válida.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const { error } = await createAdjustment(adjustProduct.id, qty, adjustType, adjustNotes || undefined);
    setIsSaving(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: "Ajuste registrado", description: `Stock de "${adjustProduct.name}" actualizado.` });
      setAdjustDialogOpen(false);
    }
  };

  const openMovementsDialog = async (product: ProductStock) => {
    setMovProduct(product);
    setProductMovements([]);
    setMovDialogOpen(true);
    setLoadingMovements(true);
    await fetchMovements(product.id);
    setLoadingMovements(false);
  };

  // Sync movements list when dialog product matches
  const displayedMovements = useMemo(() => {
    if (!movProduct) return [];
    return movements.filter((m) => m.product_id === movProduct.id);
  }, [movements, movProduct]);

  const statusBadge = (status: ProductStock["status"]) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Crítico</Badge>;
      case "low":
        return <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-white">Bajo</Badge>;
      default:
        return <Badge className="bg-green-600/90 hover:bg-green-600 text-white">OK</Badge>;
    }
  };

  const movementBadge = (type: string) => {
    const isPositive = ["compra", "ajuste_positivo", "devolucion"].includes(type);
    return (
      <Badge className={isPositive ? "bg-green-600/90 hover:bg-green-600 text-white" : "bg-red-600/90 hover:bg-red-600 text-white"}>
        {MOVEMENT_LABELS[type] || type}
      </Badge>
    );
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
            <h1 className="font-bold text-lg">Stock</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4 pb-4 flex flex-col items-center">
              <Warehouse className="w-8 h-8 text-muted-foreground mb-1" />
              <span className="text-2xl font-bold">{counts.total}</span>
              <span className="text-xs text-muted-foreground">Total productos</span>
            </CardContent>
          </Card>
          <Card className="glass-card border-red-500/30">
            <CardContent className="pt-4 pb-4 flex flex-col items-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-1" />
              <span className="text-2xl font-bold text-red-500">{counts.critical}</span>
              <span className="text-xs text-muted-foreground">Stock crítico</span>
            </CardContent>
          </Card>
          <Card className="glass-card border-yellow-500/30">
            <CardContent className="pt-4 pb-4 flex flex-col items-center">
              <ArrowDownCircle className="w-8 h-8 text-yellow-500 mb-1" />
              <span className="text-2xl font-bold text-yellow-500">{counts.low}</span>
              <span className="text-xs text-muted-foreground">Stock bajo</span>
            </CardContent>
          </Card>
          <Card className="glass-card border-green-500/30">
            <CardContent className="pt-4 pb-4 flex flex-col items-center">
              <ArrowUpCircle className="w-8 h-8 text-green-500 mb-1" />
              <span className="text-2xl font-bold text-green-500">{counts.ok}</span>
              <span className="text-xs text-muted-foreground">Stock OK</span>
            </CardContent>
          </Card>
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="low">Bajo</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stock table */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Warehouse className="w-12 h-12 mb-2 opacity-30" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Stock Actual</TableHead>
                      <TableHead className="text-right">Mín</TableHead>
                      <TableHead className="text-right">Punto Pedido</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.sku || "—"}</TableCell>
                        <TableCell className="text-right font-mono">{product.current_stock}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{product.min_stock}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{product.reorder_point}</TableCell>
                        <TableCell>{statusBadge(product.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openAdjustDialog(product)}>
                              Ajustar
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openMovementsDialog(product)}>
                              <History className="w-4 h-4" />
                            </Button>
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

      {/* Adjustment dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              {adjustProduct ? `Producto: ${adjustProduct.name} — Stock actual: ${adjustProduct.current_stock}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "ajuste_positivo" | "ajuste_negativo")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ajuste_positivo">Ajuste positivo (ingreso)</SelectItem>
                  <SelectItem value="ajuste_negativo">Ajuste negativo (egreso)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                placeholder="0"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Motivo del ajuste..."
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAdjustment} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movements dialog */}
      <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Movimientos</DialogTitle>
            <DialogDescription>
              {movProduct ? movProduct.name : ""}
            </DialogDescription>
          </DialogHeader>
          {loadingMovements ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : displayedMovements.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Sin movimientos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedMovements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(mov.created_at).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>{movementBadge(mov.movement_type)}</TableCell>
                      <TableCell className="text-right font-mono">{mov.quantity}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {mov.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stock;
