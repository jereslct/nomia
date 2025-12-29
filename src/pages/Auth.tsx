import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  useEffect(() => {
    setIsLogin(searchParams.get("mode") !== "signup");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate auth - will be replaced with Supabase
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: isLogin ? "Bienvenido de vuelta" : "Cuenta creada",
        description: isLogin 
          ? "Has iniciado sesión correctamente." 
          : "Tu cuenta ha sido creada. Revisa tu email para confirmar.",
      });
      // For demo, navigate to dashboard
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Back to Home */}
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
              <QrCode className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">QRTime</h1>
            <p className="text-muted-foreground text-sm">
              Control de asistencia inteligente
            </p>
          </div>

          {/* Auth Card */}
          <Card className="glass-card border-border/50">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </CardTitle>
              <CardDescription className="text-center">
                {isLogin 
                  ? "Ingresa tus credenciales para continuar" 
                  : "Completa tus datos para registrarte"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Juan Pérez"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
                    </>
                  ) : (
                    isLogin ? "Iniciar Sesión" : "Crear Cuenta"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      navigate(isLogin ? "/auth?mode=signup" : "/auth", { replace: true });
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isLogin ? "Regístrate" : "Inicia sesión"}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            Al continuar, aceptas nuestros{" "}
            <a href="#" className="underline hover:text-foreground">Términos de Servicio</a>
            {" "}y{" "}
            <a href="#" className="underline hover:text-foreground">Política de Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
