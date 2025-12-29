import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, Download, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceRecord {
  id: string;
  record_type: string;
  recorded_at: string;
  location_id: string;
  locations?: {
    name: string;
  };
}

const History = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id,
          record_type,
          recorded_at,
          location_id,
          locations (name)
        `)
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data || []) as AttendanceRecord[]);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Group by date
  const groupedHistory = history.reduce((acc, record) => {
    const date = record.recorded_at.split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateHours = (records: AttendanceRecord[]) => {
    const entrada = records.find(r => r.record_type === "entrada");
    const salida = records.find(r => r.record_type === "salida");
    
    if (entrada && salida) {
      const entradaTime = new Date(entrada.recorded_at).getTime();
      const salidaTime = new Date(salida.recorded_at).getTime();
      const totalMinutes = Math.floor((salidaTime - entradaTime) / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
    return "—";
  };

  const currentMonth = new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const daysWorked = new Set(Object.keys(groupedHistory)).size;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Historial</h1>
              <p className="text-xs text-muted-foreground">Tus registros de asistencia</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Month Selector */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold capitalize">{currentMonth}</p>
                  <p className="text-sm text-muted-foreground">{daysWorked} días con registro</p>
                </div>
              </div>
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
              <p className="text-muted-foreground">No hay registros de asistencia aún</p>
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
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
