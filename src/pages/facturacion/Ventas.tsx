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
  TrendingUp,
} from "lucide-react";
import { useSales, type CreateSaleParams, type SaleItem } from "@/hooks/useSales";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { usePointsOfSale } from "@/hooks/usePointsOfSale";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { formatCurrency, calculateIva } from "@/lib/ivaUtils";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  iva_rate: number;
  subtotal: number;
}

type SaleChannel = "local_fisico" | "catalogo" | "online";
type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "otro";
type InvoiceType = "factura_a" | "factura_b" | "factura_c" | "sin_factura";

const CHANNEL_LABELS: Record<SaleChannel, string> = {
  local_fisico: "Local físico",
  catalogo: "Catálogo",
  online: "Online",
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

const INVOICE_LABELS: Record<InvoiceType, string> = {
  factura_a: "Factura A",
  factura_b: "Factura B",
  factura_c: "Factura C",
  sin_factura: "Sin factura",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "outline",
  partial: "secondary",
  overdue: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  partial: "Parcial",
  overdue: "Vencido",
};

const Ventas = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { sales, loading: salesLoading, createSale } = useSales();
  const { products, loading: productsLoading } = useProducts();
  const { customers } = useCustomers();
  const { pointsOfSale } = usePointsOfSale();

  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleChannel, setSaleChannel] = useState<SaleChannel>("local_fisico");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("sin_factura");
  const [customerId, setCustomerId] = useState<string>("");
  const [posId, setPosId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const availableProducts = useMemo(
    () => products.filter((p) => p.is_active && p.current_stock > 0),
    [products],
  );

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts;
    const q = searchQuery.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)),
    );
  }, [availableProducts, searchQuery]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) return prev;
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unit_price }
            : i,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          quantity: 1,
          unit_price: product.sell_price,
          cost_price: product.cost_price,
          iva_rate: product.iva_rate,
          subtotal: product.sell_price,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, delta: number) => {
      setCart((prev) => {
        const product = products.find((p) => p.id === productId);
        return prev
          .map((item) => {
            if (item.product_id !== productId) return item;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (product && newQty > product.current_stock) return item;
            return { ...item, quantity: newQty, subtotal: newQty * item.unit_price };
          })
          .filter(Boolean) as CartItem[];
      });
    },
    [products],
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const totals = useMemo(() => {
    let subtotal = 0;
    let ivaTotal = 0;
    let total = 0;

    const ivaInvoiceType =
      invoiceType === "sin_factura" ? "factura_c" : invoiceType;

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
  }, [cart, invoiceType]);

  const handleConfirmSale = async () => {
    if (cart.length === 0) {
      toast({ title: "Carrito vacío", description: "Agregá al menos un producto.", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const isFormal = invoiceType !== "sin_factura";
    const items: SaleItem[] = cart.map((c) => ({
      product_id: c.product_id,
      quantity: c.quantity,
      unit_price: c.unit_price,
      cost_price_snapshot: c.cost_price,
      subtotal: c.subtotal,
      iva_rate: c.iva_rate,
      product_name: c.name,
    }));

    const params: CreateSaleParams = {
      sale_channel: saleChannel,
      payment_method: paymentMethod,
      payment_status: "paid",
      is_formal: isFormal,
      invoice_type: isFormal ? invoiceType : undefined,
      customer_id: customerId || null,
      pos_id: posId || null,
      items,
      subtotal: totals.subtotal,
      iva_amount: totals.iva,
      total: totals.total,
    };

    const result = await createSale(params);
    setSubmitting(false);

    if (result?.error) {
      toast({ title: "Error al registrar venta", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Venta registrada", description: `Total: ${formatCurrency(totals.total)}` });
      setCart([]);
      setCustomerId("");
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
            <h1 className="font-bold text-lg">Ventas</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="pos" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pos" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Nueva Venta
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <Receipt className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* ───────── POS MODE ───────── */}
          <TabsContent value="pos">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT — Product search & grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, SKU o código de barras…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {productsLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Cargando productos…
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery ? "Sin resultados para la búsqueda" : "No hay productos disponibles"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
                                {formatCurrency(product.sell_price)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Stock: {product.current_stock}
                              </span>
                            </div>
                            {product.sku && (
                              <span className="text-xs text-muted-foreground truncate">
                                SKU: {product.sku}
                              </span>
                            )}
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
              </div>

              {/* RIGHT — Cart + Config + Totals */}
              <div className="space-y-4">
                <Card className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Carrito
                      {cart.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {cart.reduce((s, i) => s + i.quantity, 0)} ítem(s)
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cart.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Agregá productos para comenzar
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div
                            key={item.product_id}
                            className="rounded-lg border border-border p-3 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-tight">{item.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatCurrency(item.unit_price)} c/u
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => removeFromCart(item.product_id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.product_id, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.product_id, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <span className="text-sm font-semibold">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Config */}
                <Card className="glass-card">
                  <CardContent className="pt-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Canal de Venta</Label>
                      <Select
                        value={saleChannel}
                        onValueChange={(v) => setSaleChannel(v as SaleChannel)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(CHANNEL_LABELS) as [SaleChannel, string][]).map(
                            ([val, label]) => (
                              <SelectItem key={val} value={val}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Método de Pago</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(PAYMENT_LABELS) as [PaymentMethod, string][]).map(
                            ([val, label]) => (
                              <SelectItem key={val} value={val}>
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo de Comprobante</Label>
                      <Select
                        value={invoiceType}
                        onValueChange={(v) => setInvoiceType(v as InvoiceType)}
                      >
                        <SelectTrigger className="h-9">
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

                    <div className="space-y-1.5">
                      <Label className="text-xs">Cliente (opcional)</Label>
                      <Select value={customerId} onValueChange={setCustomerId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Sin cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin cliente</SelectItem>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {pointsOfSale.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Punto de Venta (opcional)</Label>
                        <Select value={posId} onValueChange={setPosId}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Sin punto de venta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin punto de venta</SelectItem>
                            {pointsOfSale.map((pos) => (
                              <SelectItem key={pos.id} value={pos.id}>
                                {pos.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Totals & confirm */}
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
                      onClick={handleConfirmSale}
                    >
                      <Receipt className="w-4 h-4" />
                      {submitting ? "Procesando…" : "Confirmar Venta"}
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
                  <TrendingUp className="w-4 h-4" />
                  Historial de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Cargando ventas…
                  </div>
                ) : sales.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay ventas registradas
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Canal</TableHead>
                          <TableHead>Método Pago</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Formal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(sale.date).toLocaleDateString("es-AR")}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(sale.total)}
                            </TableCell>
                            <TableCell>
                              {CHANNEL_LABELS[sale.sale_channel] ?? sale.sale_channel}
                            </TableCell>
                            <TableCell>
                              {PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_VARIANT[sale.payment_status] ?? "outline"}>
                                {STATUS_LABELS[sale.payment_status] ?? sale.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sale.is_formal ? "default" : "outline"}>
                                {sale.is_formal ? "Sí" : "No"}
                              </Badge>
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

export default Ventas;
