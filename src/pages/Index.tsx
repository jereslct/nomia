import { Button } from "@/components/ui/button";
import { 
  QrCode, Clock, Users, Receipt, Calculator, TrendingUp, 
  ArrowRight, ExternalLink, Sparkles, ChevronDown 
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const projects = [
  {
    id: 1,
    name: "Nomia",
    subtitle: "Control de Asistencia",
    description: "Ingreso y egreso de empleados a través de QR. Gestión de horarios, turnos, reportes en tiempo real y más.",
    icon: QrCode,
    status: "live" as const,
    url: "https://beam-in-out.lovable.app",
    internalUrl: "/auth",
    features: ["Escaneo QR", "Turnos y horarios", "Reportes", "Multi-ubicación"],
    phase: "Fase 1",
    gradient: "from-blue-600 to-cyan-500",
    bgGlow: "bg-blue-500/20",
  },
  {
    id: 2,
    name: "Proyecto 2",
    subtitle: "En Desarrollo",
    description: "Segundo proyecto en desarrollo. Nuevas funcionalidades para potenciar tu negocio.",
    icon: Sparkles,
    status: "live" as const,
    url: "https://lovable.dev/projects/f6361105-6c1b-4e3c-855e-a2ae73bd8fef",
    features: ["En desarrollo", "Próximamente más info"],
    phase: "Activo",
    gradient: "from-violet-600 to-purple-500",
    bgGlow: "bg-violet-500/20",
  },
  {
    id: 3,
    name: "AFIP Connect",
    subtitle: "Contabilidad & ARCA",
    description: "Conexión directa con AFIP. Contabilidad básica, factura A, compras sin boleta, resumen de IVA vendedor.",
    icon: Calculator,
    status: "coming_soon" as const,
    features: ["Conexión AFIP", "Contabilidad básica", "Facturas A/B", "Resumen IVA"],
    phase: "Fase 2",
    gradient: "from-emerald-600 to-teal-500",
    bgGlow: "bg-emerald-500/20",
  },
  {
    id: 4,
    name: "Factura Pro",
    subtitle: "Facturación & Stock",
    description: "Sistema completo de facturación, movimientos de mercadería, stock, venta por catálogo y local físico. Reportes de vendedores.",
    icon: Receipt,
    status: "coming_soon" as const,
    features: ["Facturación", "Control de stock", "Catálogo online", "Reportes de ventas"],
    phase: "Fase 2",
    gradient: "from-amber-600 to-orange-500",
    bgGlow: "bg-amber-500/20",
  },
  {
    id: 5,
    name: "Rentabilidad 360",
    subtitle: "Control de Gastos",
    description: "Control integral de gastos por unidad de negocio. Sueldos, alquileres, servicios, rentabilidad y punto de equilibrio.",
    icon: TrendingUp,
    status: "coming_soon" as const,
    features: ["Gastos por local", "Sueldos", "Rentabilidad", "Punto de equilibrio"],
    phase: "Fase 3",
    gradient: "from-rose-600 to-pink-500",
    bgGlow: "bg-rose-500/20",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Suite</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90">
                Comenzar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-5xl relative">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center space-y-8"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Ecosistema de Gestión para Tiendas
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]">
              Todas tus
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-violet-600 bg-clip-text text-transparent">
                herramientas
              </span>
              <br />
              en un solo lugar
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Desde el control de asistencia hasta la rentabilidad de tu negocio. 
              Un ecosistema completo que crece con vos.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/auth?mode=signup">
                <Button size="xl" className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-0 hover:opacity-90 shadow-lg shadow-blue-500/25 group">
                  Explorar Productos
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} custom={4} className="pt-8 flex justify-center">
              <ChevronDown className="w-6 h-6 text-muted-foreground animate-bounce" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-20 px-6" id="productos">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-16"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Productos</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              El ecosistema completo
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Cada herramienta resuelve una necesidad clave de tu negocio y se integra con las demás.
            </p>
          </motion.div>

          {/* Featured Project - Nomia */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-8"
          >
            <ProjectCardLarge project={projects[0]} />
          </motion.div>

          {/* Grid of other projects */}
          <div className="grid md:grid-cols-2 gap-6">
            {projects.slice(1).map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap / Phases */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-16"
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest">Roadmap</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Fases del proyecto
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border" />

            {[
              {
                phase: "Fase 1",
                title: "Control de Asistencia",
                description: "Ingreso/egreso QR, horarios, legajo, vacaciones, evaluación de desempeño, reportes de faltas.",
                status: "Completado",
                statusColor: "bg-emerald-500",
              },
              {
                phase: "Fase 2",
                title: "Facturación & AFIP",
                description: "Conexión AFIP, facturación A/B, stock, catálogo, reportes de ventas por vendedor, alertas de faltantes.",
                status: "Próximamente",
                statusColor: "bg-amber-500",
              },
              {
                phase: "Fase 3",
                title: "Control Comercial",
                description: "Gastos por unidad de negocio, sueldos, rentabilidad, porcentajes de venta, punto de equilibrio.",
                status: "Planificado",
                statusColor: "bg-muted-foreground",
              },
            ].map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className={`relative flex items-start gap-6 mb-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-background z-10" />

                <div className={`ml-16 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                  <div className={`glass-card rounded-2xl p-6 hover-lift`}>
                    <div className={`inline-flex items-center gap-2 mb-3`}>
                      <div className={`w-2 h-2 rounded-full ${phase.statusColor}`} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {phase.phase} · {phase.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{phase.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{phase.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-violet-600" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />

            <div className="relative space-y-6 text-white">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Empezá a gestionar tu negocio hoy
              </h2>
              <p className="text-white/80 max-w-xl mx-auto text-lg">
                Nomia ya está disponible. Registrate gratis y probá el control de asistencia por QR.
              </p>
              <Link to="/auth?mode=signup">
                <Button 
                  size="xl"
                  className="bg-white text-blue-700 hover:bg-white/90 shadow-xl shadow-black/20 font-bold mt-4"
                >
                  Crear Cuenta Gratis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border/50">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">S</span>
            </div>
            <span className="font-bold">Suite</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 · Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

/* ──────────── Project Cards ──────────── */

type Project = typeof projects[number];

const StatusBadge = ({ status }: { status: "live" | "coming_soon" }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
    status === "live" 
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
      : "bg-muted text-muted-foreground"
  }`}>
    {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
    {status === "live" ? "Disponible" : "Próximamente"}
  </span>
);

const ProjectCardLarge = ({ project }: { project: Project }) => (
  <div className="group relative glass-card rounded-3xl overflow-hidden hover-lift">
    <div className={`absolute inset-0 ${project.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <div className="relative p-8 md:p-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${project.gradient} bg-clip-text text-transparent`}>
              {project.phase}
            </span>
            <StatusBadge status={project.status} />
          </div>

          <div>
            <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{project.name}</h3>
            <p className="text-lg text-muted-foreground">{project.subtitle}</p>
          </div>

          <p className="text-muted-foreground leading-relaxed max-w-lg">{project.description}</p>

          <div className="flex flex-wrap gap-2">
            {project.features.map((f) => (
              <span key={f} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {f}
              </span>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            {project.internalUrl && (
              <Link to={project.internalUrl}>
                <Button className={`bg-gradient-to-r ${project.gradient} text-white border-0 hover:opacity-90`}>
                  Abrir App
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {project.url && (
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4" />
                  Ver Sitio
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Visual element */}
        <div className="hidden md:flex items-center justify-center w-64 h-64 flex-shrink-0">
          <div className={`w-full h-full rounded-3xl bg-gradient-to-br ${project.gradient} opacity-10 absolute`} />
          <div className="relative flex items-center justify-center w-full h-full">
            <project.icon className={`w-28 h-28 bg-gradient-to-br ${project.gradient} bg-clip-text`} style={{ color: 'hsl(var(--primary))' }} strokeWidth={1} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProjectCard = ({ project }: { project: Project }) => (
  <div className="group relative glass-card rounded-2xl overflow-hidden hover-lift h-full">
    <div className={`absolute inset-0 ${project.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
    <div className="relative p-7 space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.gradient} flex items-center justify-center`}>
          <project.icon className="w-6 h-6 text-white" />
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${project.gradient} bg-clip-text text-transparent`}>
            {project.phase}
          </span>
        </div>
        <h3 className="text-xl font-bold tracking-tight mb-1">{project.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{project.subtitle}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {project.features.map((f) => (
          <span key={f} className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px] font-medium">
            {f}
          </span>
        ))}
      </div>

      {project.status === "live" && project.url && (
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-flex">
          <Button variant="outline" size="sm" className="group/btn">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver Proyecto
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </a>
      )}
    </div>
  </div>
);

export default Index;
