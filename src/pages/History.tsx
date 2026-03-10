import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, ChevronDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToExcel, buildTimestamp } from "@/lib/exportUtils";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  record_type: string;
  recorded_at: string;
  location_id: string;
  locations?: {
    name: string;
  };
}

const PAGE_SIZE = 20;

const History = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!loading && !user) navigate(ROUTES.ACCESO);
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setCurrentPage(1);
      fetchHistory(1);
    }
  }, [user, selectedMonth]);

  const fetchHistory = async (page: number) => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      const offset = (page - 1) * PAGE_SIZE;

      const { count } = await supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("recorded_at", monthStart.toISOString())
        .lte("recorded_at", monthEnd.toISOString());

      setTotalCount(count || 0);

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`id, record_type, recorded_at, location_id, locations (name)`)
        .eq("user_id", user.id)
        .gte("recorded_at", monthStart.toISOString())
        .lte("recorded_at", monthEnd.toISOString())
        .order("recorded_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;
      setHistory((data || []) as AttendanceRecord[]);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchHistory(page);
  };

  const groupedHistory = useMemo(() => {
    return history.reduce((acc, record) => {
      const date = record.recorded_at.split("T")[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {} as Record<string, AttendanceRecord[]>);
  }, [history]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return format(date, "EEEE, d 'de' MMMM", { locale: es });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  const calculateHours = (records: AttendanceRecord[]) => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const entradas = sorted.filter((r) => r.record_type === "entrada");
    const salidas = sorted.filter((r) => r.record_type === "salida");
    const pairs = Math.min(entradas.length, salidas.length);

    if (pairs === 0) return "—";

    let totalMinutes = 0;
    for (let i = 0; i < pairs; i++) {
      const diff = new Date(salidas[i].recorded_at).getTime() - new Date(entradas[i].recorded_at).getTime();
      if (diff > 0) totalMinutes += diff / (1000 * 60);
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  const monthLabel = format(selectedMonth, "MMMM yyyy", { locale: es });
  const daysWorked = new Set(Object.keys(groupedHistory)).size;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canGoNext = selectedMonth < startOfMonth(new Date());

  const exportColumns = [
    { header: "Fecha", accessor: (r: AttendanceRecord) => format(new Date(r.recorded_at), "dd/MM/yyyy") },
    { header: "Hora", accessor: (r: AttendanceRecord) => format(new Date(r.recorded_at), "HH:mm:ss") },
    { header: "Tipo", accessor: (r: AttendanceRecord) => r.record_type === "entrada" ? "Entrada" : "Salida" },
    { header: "Ubicación", accessor: (r: AttendanceRecord) => r.locations?.name || "—" },
  ];

  const handleExportCSV = () => {
    exportToCSV(history, exportColumns, `mi_asistencia_${format(selectedMonth, "yyyy-MM")}_${buildTimestamp()}.csv`);
  };

  const handleExportExcel = () => {
    exportToExcel(history, exportColumns, `mi_asistencia_${format(selectedMonth, "yyyy-MM")}_${buildTimestamp()}.xlsx`, "Asistencia");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={ROUTES.PANEL}>
              <Button variant="ghost" size="icon" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Historial</h1>
              <p className="text-xs text-muted-foreground">Tus registros de asistencia</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={history.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
                <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Month Selector */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setSelectedMonth((m) => subMonths(m, 1))} aria-label="Mes anterior">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold capitalize">{monthLabel}</p>
                  <p className="text-sm text-muted-foreground">{daysWorked} días con registro · {totalCount} registros</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
                disabled={!canGoNext}
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay registros en este mes</p>
              <p className="text-sm text-muted-foreground mt-1">Escanea un código QR para comenzar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedHistory).map(([date, records]) => (
              <Card key={date} className="glass-card overflow-hidden">
                <CardHeader className="pb-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize">
                      {formatDate(date)}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{calculateHours(records)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="space-y-2">
                    {records.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          record.record_type === "entrada"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {record.record_type === "entrada"
                            ? <CheckCircle className="w-4 h-4" />
                            : <XCircle className="w-4 h-4" />
                          }
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize text-sm">{record.record_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {record.locations?.name || "Ubicación no disponible"}
                          </p>
                        </div>
                        <span className="font-mono text-sm">{formatTime(record.recorded_at)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} aria-label="Página anterior">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} aria-label="Página siguiente">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
