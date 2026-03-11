import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Plus, Search, Edit, ToggleLeft, ToggleRight, Package,
} from "lucide-react";

import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, Product } from "@/hooks/useProducts";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useBrands } from "@/hooks/useBrands";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatCurrency } from "@/lib/ivaUtils";
import { useToast } from "@/hooks/use-toast";

const EMPTY_FORM = {
  name: "",
  description: "",
  sku: "",
  barcode: "",
  category_id: "",
  supplier_id: "",
  brand_id: "",
  cost_price: "",
  sell_price: "",
  iva_rate: "21",
  min_stock: "0",
  reorder_point: "0",
  cost_currency: "ARS",
  cost_exchange_rate: "",
};

type FormState = typeof EMPTY_FORM;

const Productos = () => {
  const { isAdmin } = useAuth();
  const { products, loading, createProduct, updateProduct, toggleActive } = useProducts();
  const { categories } = useProductCategories();
  const { brands } = useBrands();
  const { suppliers } = useSuppliers();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !(p.sku?.toLowerCase().includes(q)) && !(p.barcode?.toLowerCase().includes(q))) return false;
      if (filterCategory !== "all" && p.category_id !== filterCategory) return false;
      if (filterStatus === "active" && !p.is_active) return false;
      if (filterStatus === "inactive" && p.is_active) return false;
      return true;
    });
  }, [products, search, filterCategory, filterStatus]);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      category_id: p.category_id ?? "",
      supplier_id: p.supplier_id ?? "",
      brand_id: p.brand_id ?? "",
      cost_price: String(p.cost_price),
      sell_price: String(p.sell_price),
      iva_rate: String(p.iva_rate),
      min_stock: String(p.min_stock),
      reorder_point: String(p.reorder_point),
      cost_currency: p.cost_currency,
      cost_exchange_rate: p.cost_exchange_rate != null ? String(p.cost_exchange_rate) : "",
    });
    setDialogOpen(true);
  };

  const handleField = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Error", description: "El nombre es obligatorio.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description || undefined,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      brand_id: form.brand_id || null,
      cost_price: Number(form.cost_price) || 0,
      sell_price: Number(form.sell_price) || 0,
      iva_rate: Number(form.iva_rate),
      min_stock: Number(form.min_stock) || 0,
      reorder_point: Number(form.reorder_point) || 0,
      cost_currency: form.cost_currency,
      cost_exchange_rate: form.cost_exchange_rate ? Number(form.cost_exchange_rate) : null,
    };

    const { error } = editingId
      ? await updateProduct(editingId, payload)
      : await createProduct(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Producto actualizado" : "Producto creado" });
      setDialogOpen(false);
    }
  };

  const handleToggle = async (p: Product) => {
    const { error } = await toggleActive(p.id, !p.is_active);
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" });
    } else {
      toast({ title: p.is_active ? "Producto desactivado" : "Producto activado" });
    }
  };

  const stockBadge = (p: Product) => {
    if (p.current_stock <= p.min_stock)
      return <Badge variant="destructive">Crítico</Badge>;
    if (p.current_stock <= p.reorder_point)
      return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Bajo</Badge>;
    return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">OK</Badge>;
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
            <h1 className="font-bold text-lg">Productos</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SKU o código de barras..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | "active" | "inactive")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
          </Button>
        </div>

        {/* Table Card */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No se encontraron productos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                      <TableHead className="text-right">Venta</TableHead>
                      <TableHead className="text-right">IVA%</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{p.sku ?? "—"}</TableCell>
                        <TableCell>{p.category?.name ?? "—"}</TableCell>
                        <TableCell>{p.brand?.name ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.cost_price, p.cost_currency)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(p.sell_price)}
                        </TableCell>
                        <TableCell className="text-right">{p.iva_rate}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="tabular-nums">{p.current_stock}</span>
                            {stockBadge(p)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? "default" : "secondary"}>
                            {p.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggle(p)} title={p.is_active ? "Desactivar" : "Activar"}>
                              {p.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Modificá los datos del producto." : "Completá los datos para crear un nuevo producto."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {/* Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="prod-name">Nombre *</Label>
              <Input id="prod-name" value={form.name} onChange={(e) => handleField("name", e.target.value)} placeholder="Nombre del producto" />
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="prod-desc">Descripción</Label>
              <Input id="prod-desc" value={form.description} onChange={(e) => handleField("description", e.target.value)} placeholder="Descripción opcional" />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="prod-sku">SKU</Label>
              <Input id="prod-sku" value={form.sku} onChange={(e) => handleField("sku", e.target.value)} placeholder="SKU" />
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <Label htmlFor="prod-barcode">Código de Barras</Label>
              <Input id="prod-barcode" value={form.barcode} onChange={(e) => handleField("barcode", e.target.value)} placeholder="EAN / UPC" />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.category_id || "none"} onValueChange={(v) => handleField("category_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select value={form.brand_id || "none"} onValueChange={(v) => handleField("brand_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin marca" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin marca</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier */}
            <div className="space-y-2 sm:col-span-2">
              <Label>Proveedor</Label>
              <Select value={form.supplier_id || "none"} onValueChange={(v) => handleField("supplier_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cost Price */}
            <div className="space-y-2">
              <Label htmlFor="prod-cost">Precio de Costo</Label>
              <Input id="prod-cost" type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => handleField("cost_price", e.target.value)} placeholder="0.00" />
            </div>

            {/* Sell Price */}
            <div className="space-y-2">
              <Label htmlFor="prod-sell">Precio de Venta</Label>
              <Input id="prod-sell" type="number" min="0" step="0.01" value={form.sell_price} onChange={(e) => handleField("sell_price", e.target.value)} placeholder="0.00" />
            </div>

            {/* IVA Rate */}
            <div className="space-y-2">
              <Label>Alícuota IVA</Label>
              <Select value={form.iva_rate} onValueChange={(v) => handleField("iva_rate", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="10.5">10,5%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="27">27%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cost Currency */}
            <div className="space-y-2">
              <Label>Moneda Costo</Label>
              <Select value={form.cost_currency} onValueChange={(v) => handleField("cost_currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exchange Rate (shown when USD) */}
            {form.cost_currency === "USD" && (
              <div className="space-y-2">
                <Label htmlFor="prod-exchange">Tipo de Cambio</Label>
                <Input id="prod-exchange" type="number" min="0" step="0.01" value={form.cost_exchange_rate} onChange={(e) => handleField("cost_exchange_rate", e.target.value)} placeholder="Ej: 950" />
              </div>
            )}

            {/* Min Stock */}
            <div className="space-y-2">
              <Label htmlFor="prod-minstock">Stock Mínimo</Label>
              <Input id="prod-minstock" type="number" min="0" value={form.min_stock} onChange={(e) => handleField("min_stock", e.target.value)} placeholder="0" />
            </div>

            {/* Reorder Point */}
            <div className="space-y-2">
              <Label htmlFor="prod-reorder">Punto de Reposición</Label>
              <Input id="prod-reorder" type="number" min="0" value={form.reorder_point} onChange={(e) => handleField("reorder_point", e.target.value)} placeholder="0" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Productos;
