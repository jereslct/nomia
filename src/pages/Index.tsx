import { Button } from "@/components/ui/button";
import { QrCode, Clock, Users, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Nomia</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Clock className="w-4 h-4" />
              Control de Asistencia Inteligente
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Marca tu asistencia
              <br />
              <span className="text-gradient">con un simple escaneo</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema moderno de control de asistencia basado en códigos QR. 
              Rápido, seguro y fácil de usar para empresas de cualquier tamaño.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="group">
                  Comenzar Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero-outline" size="xl">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 gradient-primary opacity-10 blur-3xl rounded-full" />
            <div className="relative glass-card rounded-3xl p-8 md:p-12 hover-lift">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* QR Code Demo */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-48 h-48 md:w-64 md:h-64 bg-card rounded-2xl shadow-xl flex items-center justify-center p-4 animate-pulse-glow">
                    <div className="w-full h-full bg-foreground/5 rounded-xl flex items-center justify-center">
                      <QrCode className="w-24 h-24 md:w-32 md:h-32 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Código QR de ejemplo</p>
                </div>

                {/* Features List */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold">¿Cómo funciona?</h3>
                  <div className="space-y-4">
                    {[
                      "El administrador genera un código QR único",
                      "El empleado escanea con su celular",
                      "Se registra entrada o salida automáticamente",
                      "Accede a reportes en tiempo real",
                    ].map((step, index) => (
                      <div key={index} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                        </div>
                        <p className="text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Todo lo que necesitas
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Funcionalidades diseñadas para simplificar la gestión de asistencia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: QrCode,
                title: "Códigos QR Dinámicos",
                description: "Genera códigos únicos por ubicación con expiración automática para mayor seguridad.",
              },
              {
                icon: Clock,
                title: "Registro en Tiempo Real",
                description: "Visualiza las entradas y salidas de tu equipo al instante desde cualquier dispositivo.",
              },
              {
                icon: Users,
                title: "Gestión de Equipos",
                description: "Administra empleados, turnos y permisos de forma sencilla e intuitiva.",
              },
              {
                icon: Shield,
                title: "Seguridad Avanzada",
                description: "Verificación de ubicación y prevención de registros duplicados.",
              },
              {
                icon: CheckCircle,
                title: "Reportes Detallados",
                description: "Exporta informes de asistencia, horas trabajadas y más.",
              },
              {
                icon: ArrowRight,
                title: "Fácil Integración",
                description: "Conecta con tu sistema de nómina y otras herramientas.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-6 hover-lift group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="gradient-primary rounded-3xl p-8 md:p-12 text-center text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
            <div className="relative space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Comienza a controlar tu asistencia hoy
              </h2>
              <p className="text-primary-foreground/80 max-w-xl mx-auto">
                Únete a cientos de empresas que ya simplifican su gestión de tiempo con QRTime.
              </p>
              <Link to="/auth?mode=signup">
                <Button 
                  size="xl" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl"
                >
                  Crear Cuenta Gratis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">QRTime</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 QRTime. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
