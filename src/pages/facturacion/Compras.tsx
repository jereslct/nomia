import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Minus,
  Receipt,
} from "lucide-react";
import { usePurchases, type PurchaseItem } from "@/hooks/usePurchases";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { formatCurrency, calculateIva } from "@/lib/ivaUtils";
import { useToast } from "@/hooks/use-toast";

type InvoiceType = "factura_a" | "factura_b" | "factura_c";

const INVOICE_LABELS: Record<InvoiceType, string> = {
  factura_a: "Factura A",
  factura_b: "Factura B",
  factura_c: "Factura C",
};

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  iva_rate: number;
  subtotal: number;
}

const Compras = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { purchases, loading: purchasesLoading, createPurchase, refetch } = usePurchases();
  const { products, loading: productsLoading } = useProducts();
  const { suppliers } = useSuppliers();

  const [activeTab, setActiveTab] = useState("nueva");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [supplierId, setSupplierId] = useState<string>("");
  const [conFactura, setConFactura] = useState(true);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("factura_b");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.filter((p) => p.is_active);
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.is_active &&
        (p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))),
    );
  }, [products, searchQuery]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unit_price,
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.cost_price,
          iva_rate: product.iva_rate,
          subtotal: product.cost_price,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unit_price,
          };
        })
        .filter(Boolean) as CartItem[],
    );
  }, []);

  const updateUnitPrice = useCallback((productId: string, unitPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, unit_price: unitPrice, subtotal: item.quantity * unitPrice }
          : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const ivaInvoiceType = conFactura ? invoiceType : "factura_c";

  const totals = useMemo(() => {
    let subtotal = 0;
    let ivaTotal = 0;
    let total = 0;
    for (const item of cart) {
      const calc = calculateIva(item.subtotal, item.iva_rate, ivaInvoiceType);
      subtotal += calc.neto;
      ivaTotal += calc.iva;
      total += calc.total;
    }
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      iva: Math.round(ivaTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [cart, ivaInvoiceType]);

  const handleRegistrarCompra = async () => {
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agregá al menos un producto para registrar la compra.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);

    const items: PurchaseItem[] = cart.map((c) => ({
      product_id: c.product_id,
      quantity: c.quantity,
      unit_price: c.unit_price,
      subtotal: (() => {
        const calc = calculateIva(c.subtotal, c.iva_rate, ivaInvoiceType);
        return Math.round(calc.neto * 100) / 100;
      })(),
    }));

    const result = await createPurchase({
      supplier_id: supplierId || null,
      is_formal: conFactura,
      invoice_type: conFactura ? invoiceType : undefined,
      notes: notes.trim() || undefined,
      items,
      subtotal: totals.subtotal,
      iva_amount: totals.iva,
      total: totals.total,
    });

    setSubmitting(false);

    if (result?.error) {
      toast({
        title: "Error al registrar compra",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Compra registrada",
        description: `Total: ${formatCurrency(totals.total)}`,
      });
      setCart([]);
      setSupplierId("");
      setNotes("");
      refetch();
    }
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
            <h1 className="font-bold text-lg">Compras</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="nueva" className="gap-2">
              <Plus className="w-4 h-4" />
              Nueva Compra
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <Receipt className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* ───────── NUEVA COMPRA ───────── */}
          <TabsContent value="nueva" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* Proveedor y tipo de factura */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Datos de la compra</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Proveedor</Label>
                      <Select value={supplierId} onValueChange={setSupplierId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                          {suppliers.length === 0 && (
                            <SelectItem value="none" disabled>
                              No hay proveedores cargados
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="con-factura"
                          checked={conFactura}
                          onChange={() => setConFactura(true)}
                          className="rounded"
                        />
                        <Label htmlFor="con-factura" className="cursor-pointer">
                          Con factura
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="sin-factura"
                          checked={!conFactura}
                          onChange={() => setConFactura(false)}
                          className="rounded"
                        />
                        <Label htmlFor="sin-factura" className="cursor-pointer">
                          Sin factura
                        </Label>
                      </div>
                    </div>

                    {conFactura && (
                      <div className="space-y-1.5">
                        <Label>Tipo de factura</Label>
                        <Select
                          value={invoiceType}
                          onValueChange={(v) => setInvoiceType(v as InvoiceType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(INVOICE_LABELS) as [InvoiceType, string][]).map(
                              ([val, label]) => (
                                <SelectItem key={val} value={val}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label>Notas (opcional)</Label>
                      <Input
                        placeholder="Notas adicionales"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Búsqueda y productos */}
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Buscar y agregar productos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre, SKU o código de barras…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {productsLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Cargando productos…
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "Sin resultados para la búsqueda"
                          : "No hay productos disponibles"}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto">
                        {filteredProducts.map((product) => {
                          const inCart = cart.find((c) => c.product_id === product.id);
                          return (
                            <Card
                              key={product.id}
                              className="glass-card hover:border-primary/40 transition-colors cursor-pointer"
                              onClick={() => addToCart(product)}
                            >
                              <CardContent className="p-4 flex flex-col gap-1">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-medium text-sm line-clamp-2 leading-tight">
                                    {product.name}
                                  </span>
                                  {inCart && (
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {inCart.quantity}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-base font-semibold text-primary">
                                    {formatCurrency(product.cost_price)}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 w-full gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product);
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Agregar
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Carrito y totales */}
              <div className="space-y-4">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Ítems de la compra
                      {cart.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {cart.reduce((s, i) => s + i.quantity, 0)} ítem(s)
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Agregá productos para comenzar
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Cant.</TableHead>
                              <TableHead className="text-right">Precio Unit.</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                              <TableHead className="w-10">Quitar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cart.map((item) => (
                              <TableRow key={item.product_id}>
                                <TableCell className="font-medium max-w-[140px] truncate">
                                  {item.name}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => updateQuantity(item.product_id, -1)}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => updateQuantity(item.product_id, 1)}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    className="h-8 w-24 text-right"
                                    value={item.unit_price}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      if (!isNaN(v) && v >= 0)
                                        updateUnitPrice(item.product_id, v);
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.subtotal)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => removeFromCart(item.product_id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal (neto)</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA</span>
                      <span>{formatCurrency(totals.iva)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(totals.total)}</span>
                    </div>
                    <Button
                      className="w-full mt-2 gap-2"
                      size="lg"
                      disabled={cart.length === 0 || submitting}
                      onClick={handleRegistrarCompra}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {submitting ? "Procesando…" : "Registrar Compra"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ───────── HISTORIAL ───────── */}
          <TabsContent value="historial">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Historial de Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                {purchasesLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Cargando compras…
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay compras registradas
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Formal</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(purchase.date).toLocaleDateString("es-AR")}
                            </TableCell>
                            <TableCell>
                              {(purchase.supplier as { name?: string })?.name ?? "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(purchase.total)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={purchase.is_formal ? "default" : "outline"}
                              >
                                {purchase.is_formal ? "Sí" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {purchase.notes ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Compras;
