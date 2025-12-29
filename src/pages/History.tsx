import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const mockHistory = [
  { id: "1", type: "entrada", date: "2024-01-15", time: "08:30", location: "Oficina Central" },
  { id: "2", type: "salida", date: "2024-01-15", time: "17:45", location: "Oficina Central" },
  { id: "3", type: "entrada", date: "2024-01-14", time: "08:15", location: "Oficina Central" },
  { id: "4", type: "salida", date: "2024-01-14", time: "18:00", location: "Oficina Central" },
  { id: "5", type: "entrada", date: "2024-01-13", time: "08:45", location: "Oficina Central" },
  { id: "6", type: "salida", date: "2024-01-13", time: "17:30", location: "Oficina Central" },
  { id: "7", type: "entrada", date: "2024-01-12", time: "08:20", location: "Oficina Central" },
  { id: "8", type: "salida", date: "2024-01-12", time: "17:50", location: "Oficina Central" },
];

const History = () => {
  const [selectedMonth] = useState("Enero 2024");

  // Group by date
  const groupedHistory = mockHistory.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, typeof mockHistory>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { 
      weekday: "long", 
      day: "numeric", 
      month: "long" 
    });
  };

  const calculateHours = (records: typeof mockHistory) => {
    const entrada = records.find(r => r.type === "entrada");
    const salida = records.find(r => r.type === "salida");
    
    if (entrada && salida) {
      const [entradaH, entradaM] = entrada.time.split(":").map(Number);
      const [salidaH, salidaM] = salida.time.split(":").map(Number);
      const totalMinutes = (salidaH * 60 + salidaM) - (entradaH * 60 + entradaM);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
    return "—";
  };

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
                  <p className="font-semibold">{selectedMonth}</p>
                  <p className="text-sm text-muted-foreground">18 días trabajados</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">144h</p>
                <p className="text-sm text-muted-foreground">Total horas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
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
                        record.type === "entrada" 
                          ? "bg-success/10 text-success" 
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {record.type === "entrada" 
                          ? <CheckCircle className="w-4 h-4" /> 
                          : <XCircle className="w-4 h-4" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize text-sm">{record.type}</p>
                        <p className="text-xs text-muted-foreground">{record.location}</p>
                      </div>
                      <span className="font-mono text-sm">{record.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-6 text-center">
          <Button variant="outline">
            Cargar más registros
          </Button>
        </div>
      </main>
    </div>
  );
};

export default History;
