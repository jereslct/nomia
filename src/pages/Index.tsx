import { Button } from "@/components/ui/button";
import {
  QrCode, ShieldCheck, BarChart3, Clock, Store,
  Smartphone, ArrowRight, Sparkles, MonitorPlay, FileSpreadsheet, Bell
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/* ═══════════════════ DATA ═══════════════════ */

const features = [
  {
    icon: ShieldCheck,
    title: "QR seguros y dinámicos",
    description: "Códigos con firma criptográfica que expiran automáticamente. Imposibles de falsificar ni reutilizar con capturas de pantalla.",
  },
  {
    icon: QrCode,
    title: "Fichaje en 2 segundos",
    description: "El empleado abre la app, escanea el QR de la sucursal y listo: entrada o salida registrada con hora exacta y ubicación.",
  },
  {
    icon: Store,
    title: "Multi-sucursal",
    description: "Gestioná todas tus tiendas desde una sola cuenta. Cada sede con sus empleados, turnos y configuración independiente.",
  },
  {
    icon: Clock,
    title: "Turnos y tolerancias",
    description: "Configurá horarios de entrada y salida con tolerancias configurables. Semáforo visual de puntualidad en tiempo real.",
  },
  {
    icon: BarChart3,
    title: "Dashboard en tiempo real",
    description: "Mirá quién llegó, quién está tarde y quién ya se fue. Todo tu equipo, todas las sucursales, en una sola pantalla.",
  },
  {
    icon: FileSpreadsheet,
    title: "Reportes exportables",
    description: "Puntualidad, horas trabajadas y ausencias. Exportá a CSV o Excel multi-hoja con un clic, listos para contabilidad.",
  },
];

const steps = [
  {
    icon: MonitorPlay,
    title: "Generá el QR",
    description: "Desde el panel, generá el código y mostralo en la tablet o monitor de la sucursal.",
  },
  {
    icon: Smartphone,
    title: "El empleado escanea",
    description: "Al llegar y al irse, escanea el QR desde su celular con la cámara. Sin instalar nada.",
  },
  {
    icon: Bell,
    title: "Todo queda registrado",
    description: "Horario, ubicación y puntualidad quedan guardados al instante en tus reportes.",
  },
];

/* ═══════════════════ COMPONENT ═══════════════════ */

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-2xl border-b border-border/20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-black text-lg tracking-tight">Nomia</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={ROUTES.ACCESO}>
              <Button variant="ghost" size="sm">Ingresar</Button>
            </Link>
            <Link to={`${ROUTES.ACCESO}?mode=signup`}>
              <Button variant="hero" size="sm">Comenzar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-16 pb-12">
        {/* Animated background */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px]" />
        </motion.div>

        <div className="relative z-10 container mx-auto px-6 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Control de asistencia con QR
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9]">
              <span className="block">Fichaje por QR,</span>
              <span className="block text-gradient">cero planillas</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Nomia reemplaza la planilla de papel: tus empleados marcan entrada y salida
              escaneando un QR desde su celular. Puntualidad, horarios y reportes de
              todas tus sucursales en un solo panel.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to={`${ROUTES.ACCESO}?mode=signup`}>
              <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                Crear cuenta gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Cómo funciona
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sin hardware especial
            </div_soon>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Solo un celular y un monitor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Multi-sucursal
            </span>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="funcionalidades" className="relative py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 space-y-2"
          >
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Funcionalidades</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Todo lo que necesitás</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
              Un sistema completo de asistencia laboral, simple para el empleado y poderoso para el administrador.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="glass-card rounded-2xl p-6 hover-lift space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <f.icon className="w-5 h-5 text-primary-foreground" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-black tracking-tight">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cómo funciona ─── */}
      <section id="como-funciona" className="py-16 px-6 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 space-y-2"
          >
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Simple de usar</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Cómo funciona</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
              Tres pasos, cero fricción. Tu equipo empieza a fichar el mismo día.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative rounded-2xl border border-border/50 bg-card p-6 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-4xl font-black text-muted-foreground/15 select-none">{`0${i + 1}`}</span>
                </div>
                <h3 className="text-lg font-black tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Seguridad ─── */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Anti-fraude</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                Un QR que no se puede engañar
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Cada código QR se genera con una firma criptográfica y expira en segundos o minutos.
                Un screenshot de ayer, de ayer a la mañana o incluso de hace un minuto no sirve:
                la validación ocurre en el servidor, con la hora exacta y la ubicación.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {["Firma HMAC-SHA256", "Expiración configurable", "Validación server-side", "Sin reutilización"].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="w-[320px] h-[320px] rounded-full border border-border/20"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                  className="absolute w-[220px] h-[220px] rounded-full border border-border/10"
                />
              </div>
              <div className="relative glass-card rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl shadow-primary/10">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/25">
                  <QrCode className="w-20 h-20 text-primary-foreground" strokeWidth={1.5} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-mono text-muted-foreground">nomia:nonce|ubicación|firma</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Válido por 30 segundos
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 gradient-primary" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />

            <div className="relative p-8 md:p-12 text-center space-y-4">
              <h2 className="text-2xl md:text-4xl font-black tracking-tight text-primary-foreground leading-tight">
                Dejá las planillas de papel
                <br />y empezá a fichar con QR
              </h2>
              <p className="text-primary-foreground/80 max-w-lg mx-auto text-base">
                Cargá tu equipo, generá el QR y en minutos tenés el control de asistencia
                de todas tus sucursales funcionando.
              </p>
              <Link to={`${ROUTES.ACCESO}?mode=signup`}>
                <Button
                  size="xl"
                  className="bg-background text-foreground hover:bg-background/90 shadow-2xl font-bold mt-2"
                >
                  Crear Cuenta Gratis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-6 px-6 border-t border-border/30">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <QrCode className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Nomia</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Nomia · Control de asistencia con QR</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
