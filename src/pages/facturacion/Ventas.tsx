import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { AppNavButtons } from "@/components/AppNavButtons";
import { useAuth } from "@/hooks/useAuth";

const Ventas = () => {
  const { isAdmin } = useAuth();

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

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ventas</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Registro y consulta de ventas. Próximamente.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Ventas;
