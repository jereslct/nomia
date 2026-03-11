import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Building, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AfipFormState {
  cuit: string;
  puntoVenta: string;
  certificadoUrl: string;
  environment: "testing" | "produccion";
  isActive: boolean;
}

const initialFormState: AfipFormState = {
  cuit: "",
  puntoVenta: "",
  certificadoUrl: "",
  environment: "testing",
  isActive: false,
};

const AfipConfig = () => {
  const { isAdmin } = useAuth();
  const { organizationId } = useOrganizationId();
  const { toast } = useToast();
  const [form, setForm] = useState<AfipFormState>(initialFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("afip_config")
        .select("id, cuit, punto_venta, certificado_url, environment, is_active")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración AFIP.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data) {
        setExistingId(data.id);
        setForm({
          cuit: data.cuit ?? "",
          puntoVenta: data.punto_venta != null ? String(data.punto_venta) : "",
          certificadoUrl: data.certificado_url ?? "",
          environment: (data.environment as "testing" | "produccion") ?? "testing",
          isActive: data.is_active ?? false,
        });
      } else {
        setExistingId(null);
        setForm(initialFormState);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, toast]);

  const handleSave = async () => {
    if (!organizationId) {
      toast({
        title: "Error",
        description: "No hay organización seleccionada.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        organization_id: organizationId,
        cuit: form.cuit.trim() || null,
        punto_venta: form.puntoVenta.trim() ? Number(form.puntoVenta) : null,
        certificado_url: form.certificadoUrl.trim() || null,
        environment: form.environment,
        is_active: form.isActive,
        updated_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      if (existingId) {
        const { error } = await supabase
          .from("afip_config")
          .update(payload)
          .eq("id", existingId);

        if (error) throw error;
        toast({
          title: "Guardado",
          description: "Configuración AFIP actualizada correctamente.",
        });
      } else {
        const { error } = await supabase.from("afip_config").insert(payload);

        if (error) throw error;
        const { data } = await supabase
          .from("afip_config")
          .select("id")
          .eq("organization_id", organizationId)
          .single();
        if (data) setExistingId(data.id);
        toast({
          title: "Guardado",
          description: "Configuración AFIP creada correctamente.",
        });
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
              <h1 className="font-bold text-lg">Configuración AFIP</h1>
            </div>
            {isAdmin && <AppNavButtons />}
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-6xl flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

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
            <h1 className="font-bold text-lg">Configuración AFIP</h1>
          </div>
          {isAdmin && <AppNavButtons />}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-6">
              <Building className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Datos AFIP</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="cuit">CUIT</Label>
                <Input
                  id="cuit"
                  placeholder="XX-XXXXXXXX-X"
                  value={form.cuit}
                  onChange={(e) => setForm((f) => ({ ...f, cuit: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="puntoVenta">Punto de Venta</Label>
                <Input
                  id="puntoVenta"
                  type="number"
                  min={0}
                  placeholder="Ej: 1"
                  value={form.puntoVenta}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, puntoVenta: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificadoUrl">URL Certificado (opcional)</Label>
                <Input
                  id="certificadoUrl"
                  type="url"
                  placeholder="https://..."
                  value={form.certificadoUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, certificadoUrl: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Select
                  value={form.environment}
                  onValueChange={(v: "testing" | "produccion") =>
                    setForm((f) => ({ ...f, environment: v }))
                  }
                >
                  <SelectTrigger id="environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="produccion">Producción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between space-x-2 py-2">
                <Label htmlFor="isActive">Activo</Label>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, isActive: checked }))
                  }
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AfipConfig;
