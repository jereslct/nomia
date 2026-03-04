import { Button } from "@/components/ui/button";
import {
  QrCode, Calculator, Receipt, TrendingUp, MessageSquare,
  ArrowRight, ExternalLink, Sparkles, ChevronLeft, ChevronRight, ArrowUpRight,
  Briefcase, Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════ DATA ═══════════════════ */

const categories = [
  { id: "negocios", label: "Negocios", icon: Briefcase, color: "#3b82f6" },
  { id: "bienestar", label: "Bienestar", icon: Heart, color: "#10b981" },
] as const;

const projects = [
  {
    id: 1,
    name: "Nomia",
    subtitle: "Control de Asistencia",
    description: "Ingreso y egreso de empleados a través de QR. Gestión de horarios, turnos, reportes en tiempo real y multi-ubicación.",
    icon: QrCode,
    status: "live" as const,
    url: "https://beam-in-out.lovable.app",
    internalUrl: "/auth",
    tags: ["QR Scan", "Turnos", "Reportes", "Multi-sede"],
    phase: "Fase 1",
    color: "#3b82f6",
    category: "negocios" as const,
    accentGradient: "from-blue-500 via-cyan-400 to-blue-600",
    mockupGradient: "from-blue-600/20 via-cyan-500/10 to-transparent",
  },
  {
    id: 2,
    name: "ViaticSync",
    subtitle: "Rendición de Gastos",
    description: "Escaneá comprobantes con IA, armá tu rendición en minutos y exportá el Excel listo para contabilidad. Todo desde el celular.",
    icon: Receipt,
    status: "live" as const,
    url: "https://viaticos-sync.letschange.space/landing",
    tags: ["OCR con IA", "Multi-Comprobante", "Excel", "100% Móvil"],
    phase: "Activo",
    color: "#c87533",
    category: "negocios" as const,
    accentGradient: "from-amber-600 via-orange-400 to-amber-700",
    mockupGradient: "from-amber-600/20 via-orange-500/10 to-transparent",
  },
  {
    id: 3,
    name: "NutriChat",
    subtitle: "Asistente Nutricional IA",
    description: "Convertí tu plan nutricional en PDF en un asistente inteligente. Lista de compras automática, soporte instantáneo y cero alucinaciones con tecnología RAG.",
    icon: MessageSquare,
    url: "https://nutrichat.letschange.space/",
    status: "live" as const,
    tags: ["IA + RAG", "PDF a Chat", "Lista de Compras", "100% Tu Plan"],
    color: "#10b981",
    category: "bienestar" as const,
    accentGradient: "from-emerald-500 via-teal-400 to-emerald-600",
    mockupGradient: "from-emerald-600/20 via-teal-500/10 to-transparent",
  },
  {
    id: 4,
    name: "Factura Pro",
    subtitle: "Facturación & Stock",
    description: "Facturación completa, stock, catálogo online, venta por local físico, reportes de vendedores.",
    icon: Receipt,
    status: "coming_soon" as const,
    tags: ["Facturación", "Stock", "Catálogo", "Ventas"],
    phase: "Fase 2",
    color: "#f59e0b",
    category: "negocios" as const,
    accentGradient: "from-amber-500 via-orange-400 to-amber-600",
    mockupGradient: "from-amber-600/20 via-orange-500/10 to-transparent",
  },
  {
    id: 5,
    name: "Rentabilidad 360",
    subtitle: "Control de Gastos",
    description: "Control integral por unidad de negocio. Sueldos, servicios, rentabilidad y punto de equilibrio.",
    icon: TrendingUp,
    status: "coming_soon" as const,
    tags: ["Gastos", "Sueldos", "Rentabilidad", "Equilibrio"],
    phase: "Fase 3",
    color: "#ef4444",
    category: "negocios" as const,
    accentGradient: "from-rose-500 via-pink-400 to-rose-600",
    mockupGradient: "from-rose-600/20 via-pink-500/10 to-transparent",
  },
];

/* ═══════════════════ COMPONENT ═══════════════════ */

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const paginate = useCallback((dir: number) => {
    setDirection(dir);
    setCurrentSlide((prev) => (prev + dir + projects.length) % projects.length);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 24000);
    return () => clearInterval(timer);
  }, [paginate]);

  const current = projects[currentSlide];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0, scale: 0.9 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0, scale: 0.9 }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/50 backdrop-blur-2xl border-b border-border/20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-black text-sm">S</span>
            </div>
            <span className="font-black text-lg tracking-tight">Suite</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Ingresar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm">Comenzar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Full-Screen ─── */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
        </motion.div>

        <div className="relative z-10 container mx-auto px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              Ecosistema de Gestión para Tiendas
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]">
              <span className="block">Gestión</span>
              <span className="block text-gradient">sin límites</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Todo lo que necesitás para administrar tu negocio,
              desde la asistencia hasta la rentabilidad.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-4"
          >
            <a href="#gallery">
              <Button variant="hero" size="xl" className="group">
                Ver Proyectos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Visual Gallery / Carousel ─── */}
      <section id="gallery" className="relative py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Portafolio</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Nuestros Productos</h2>
          </motion.div>

          {/* Carousel */}
          <div className="relative">
            {/* Main slide */}
            <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden bg-card border border-border/50">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                  className="absolute inset-0 flex flex-col md:flex-row"
                >
                  {/* Left: Visual */}
                  <div className="relative w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${current.mockupGradient}`} />

                    {/* Decorative circles */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border border-border/20"
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        className="absolute w-[200px] h-[200px] md:w-[280px] md:h-[280px] rounded-full border border-border/10"
                      />
                    </div>

                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="relative z-10"
                    >
                      <div
                        className={`w-32 h-32 md:w-44 md:h-44 rounded-3xl bg-gradient-to-br ${current.accentGradient} flex items-center justify-center shadow-2xl`}
                        style={{ boxShadow: `0 25px 60px -15px ${current.color}40` }}
                      >
                        <current.icon className="w-16 h-16 md:w-24 md:h-24 text-white" strokeWidth={1.5} />
                      </div>
                    </motion.div>
                  </div>

                  {/* Right: Info */}
                  <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-center p-8 md:p-14">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.5 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3">
                        {(() => {
                          const cat = categories.find(c => c.id === current.category);
                          return cat ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                              <cat.icon className="w-3 h-3" />
                              {cat.label}
                            </span>
                          ) : null;
                        })()}
                        {current.phase && (
                          <span
                            className="text-xs font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full"
                            style={{ background: `${current.color}15`, color: current.color }}
                          >
                            {current.phase}
                          </span>
                        )}
                        <StatusBadge status={current.status} />
                      </div>

                      <div>
                        <h3 className="text-3xl md:text-5xl font-black tracking-tight">{current.name}</h3>
                        <p className="text-lg text-muted-foreground mt-1">{current.subtitle}</p>
                      </div>

                      <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-md">
                        {current.description}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {current.tags.map((t) => (
                          <span key={t} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                            {t}
                          </span>
                        ))}
                      </div>

                      {current.status === "live" && current.url && (
                        <div className="flex gap-3 pt-3">
                          <a href={current.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="lg">
                              <ExternalLink className="w-4 h-4" />
                              Ver Sitio
                            </Button>
                          </a>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Nav arrows */}
              <button
                onClick={() => paginate(-1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => paginate(1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center hover:bg-background transition-colors shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {categories.map((cat, catIdx) => (
                <div key={cat.id} className="flex items-center gap-2">
                  {catIdx > 0 && (
                    <div className="w-px h-6 bg-border/60 mx-1" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hidden md:flex items-center gap-1 mr-1">
                    <cat.icon className="w-3 h-3" style={{ color: cat.color }} />
                    {cat.label}
                  </span>
                  {projects.filter(p => p.category === cat.id).map((p) => {
                    const i = projects.indexOf(p);
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }}
                        className={`group relative flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all duration-300 ${
                          i === currentSlide
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                            : "border-border/50 bg-card/50 hover:border-border hover:bg-card"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                            i === currentSlide ? "scale-110" : "opacity-60 group-hover:opacity-100"
                          }`}
                          style={{ background: i === currentSlide ? `${p.color}20` : undefined }}
                        >
                          <p.icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                        </div>
                        <span className={`text-xs font-semibold hidden md:block transition-colors ${
                          i === currentSlide ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {p.name}
                        </span>
                        {i === currentSlide && (
                          <motion.div
                            className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 6, ease: "linear" }}
                            key={`progress-${currentSlide}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid ─── */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Ecosistema</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Todos los módulos</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Cada pieza se conecta con las demás para darte una visión completa.
            </p>
          </motion.div>

          {categories.map((cat) => {
            const catProjects = projects.filter(p => p.category === cat.id);
            return (
              <div key={cat.id} className="mb-12 last:mb-0">
                {/* Category header */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${cat.color}15` }}
                  >
                    <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{cat.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {cat.id === "negocios" ? "Herramientas para gestionar tu empresa" : "Soluciones para tu bienestar personal"}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-border/50 ml-4" />
                </motion.div>

                {/* Grid */}
                <div className={`grid grid-cols-1 gap-4 auto-rows-[280px] ${
                  catProjects.length === 1 ? "md:grid-cols-1 max-w-lg" : "md:grid-cols-12"
                }`}>
                  {catProjects.map((p, i) => {
                    const span = catProjects.length === 1
                      ? ""
                      : i === 0 ? "md:col-span-7" : i === 1 ? "md:col-span-5" : "md:col-span-4";

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
                        className={`${span} group relative rounded-3xl overflow-hidden border border-border/50 bg-card hover:border-border transition-all duration-500 cursor-pointer`}
                        onClick={() => {
                          if (p.url && p.status === "live") window.open(p.url, "_blank");
                        }}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${p.mockupGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative h-full p-7 flex flex-col justify-between z-10">
                          <div className="flex items-start justify-between">
                            <div
                              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.accentGradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}
                              style={{ boxShadow: `0 10px 30px -10px ${p.color}30` }}
                            >
                              <p.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={p.status} />
                              {p.status === "live" && (
                                <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                              {p.phase}
                            </span>
                            <h3 className="text-2xl font-black tracking-tight">{p.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{p.description}</p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {p.tags.slice(0, 3).map((t) => (
                                <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-semibold">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Roadmap Visual ─── */}
      <section className="py-24 px-6 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <p className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Roadmap</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">El camino</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { phase: "Fase 1", title: "Control de Asistencia", desc: "QR, horarios, legajo, vacaciones, evaluación, reportes de faltas.", status: "live", color: "#3b82f6" },
              { phase: "Fase 2", title: "Facturación & AFIP", desc: "Conexión AFIP, facturación, stock, catálogo, reportes de ventas, alertas de faltantes.", status: "building", color: "#f59e0b" },
              { phase: "Fase 3", title: "Control Comercial", desc: "Gastos por unidad de negocio, sueldos, rentabilidad, punto de equilibrio.", status: "planned", color: "#ef4444" },
            ].map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative flex gap-6 items-start"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-4 h-4 rounded-full ring-4 ring-background z-10"
                    style={{ background: phase.color }}
                  />
                  {i < 2 && <div className="w-px h-full bg-border mt-2" />}
                </div>

                {/* Card */}
                <div className="glass-card rounded-2xl p-6 flex-1 hover-lift mb-2">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{ background: `${phase.color}15`, color: phase.color }}
                    >
                      {phase.phase}
                    </span>
                    <span className={`text-xs font-semibold ${
                      phase.status === "live" ? "text-emerald-500" : phase.status === "building" ? "text-amber-500" : "text-muted-foreground"
                    }`}>
                      {phase.status === "live" ? "● Completado" : phase.status === "building" ? "◐ En progreso" : "○ Planificado"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{phase.title}</h3>
                  <p className="text-sm text-muted-foreground">{phase.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 gradient-primary" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />

            <div className="relative p-12 md:p-20 text-center space-y-8">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-primary-foreground leading-tight">
                Empezá a gestionar
                <br />tu negocio hoy
              </h2>
              <p className="text-primary-foreground/70 max-w-lg mx-auto text-lg">
                Nomia ya está disponible. Registrate gratis y probá el control de asistencia por QR.
              </p>
              <Link to="/auth?mode=signup">
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
      <footer className="py-10 px-6 border-t border-border/30">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xs">S</span>
            </div>
            <span className="font-bold">Suite</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 · Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

/* ═══════════════════ SUB-COMPONENTS ═══════════════════ */

const StatusBadge = ({ status }: { status: "live" | "coming_soon" }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
    status === "live"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "bg-secondary text-muted-foreground"
  }`}>
    {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
    {status === "live" ? "Disponible" : "Próximamente"}
  </span>
);

export default Index;
