import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, QrCode, RefreshCw, Users, Clock, MapPin, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import QRCode from "react-qr-code";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Mock data for employees
const mockEmployees = [
  {
    id: "1",
    name: "María García",
    avatar: null,
    entryTime: "08:45",
    exitTime: null,
    status: "presente",
    location: "Oficina Central",
  },
  {
    id: "2",
    name: "Carlos López",
    avatar: null,
    entryTime: "09:15",
    exitTime: null,
    status: "tarde",
    location: "Oficina Central",
  },
  {
    id: "3",
    name: "Ana Martínez",
    avatar: null,
    entryTime: "08:30",
    exitTime: "17:00",
    status: "finalizado",
    location: "Oficina Central",
  },
  {
    id: "4",
    name: "Juan Rodríguez",
    avatar: null,
    entryTime: "08:55",
    exitTime: null,
    status: "presente",
    location: "Sucursal Norte",
  },
  {
    id: "5",
    name: "Laura Sánchez",
    avatar: null,
    entryTime: "09:30",
    exitTime: "18:15",
    status: "finalizado",
    location: "Oficina Central",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "presente":
      return <Badge className="bg-success text-success-foreground hover:bg-success/80">Presente</Badge>;
    case "tarde":
      return <Badge className="bg-warning text-warning-foreground hover:bg-warning/80">Tarde</Badge>;
    case "finalizado":
      return <Badge variant="secondary">Finalizado</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (qrDialogOpen && !qrValue) {
      generateQR();
    }
  }, [qrDialogOpen]);

  useEffect(() => {
    if (!qrDialogOpen || !qrValue) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateQR();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrDialogOpen, qrValue]);

  const generateQR = () => {
    const newCode = `qrtime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setQrValue(newCode);
    setTimeLeft(300);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const presentCount = mockEmployees.filter((e) => e.status === "presente").length;
  const lateCount = mockEmployees.filter((e) => e.status === "tarde").length;
  const finishedCount = mockEmployees.filter((e) => e.status === "finalizado").length;

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
              <h1 className="font-bold text-lg">Panel de Administrador</h1>
              <p className="text-xs text-muted-foreground">Monitor en vivo de asistencia</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Presentes</p>
                  <p className="text-2xl font-bold">{presentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tarde</p>
                  <p className="text-2xl font-bold">{lateCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Finalizados</p>
                  <p className="text-2xl font-bold">{finishedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Kiosk Card */}
        <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Kiosco QR</h3>
                  <p className="text-sm text-muted-foreground">
                    Muestra el código QR para que los empleados registren su asistencia
                  </p>
                </div>
              </div>
              <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" size="lg" className="min-w-[200px]">
                    <QrCode className="w-5 h-5" />
                    Mostrar QR de Ingreso
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl">Código de Asistencia</DialogTitle>
                    <DialogDescription className="text-center">
                      Los empleados deben escanear este código para registrar su entrada o salida
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center space-y-6 py-6">
                    {/* QR Code */}
                    <div className="relative">
                      <div className="bg-card p-6 rounded-3xl shadow-xl border border-border">
                        <QRCode
                          value={qrValue || "loading"}
                          size={280}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          bgColor="hsl(var(--card))"
                          fgColor="hsl(var(--foreground))"
                        />
                      </div>
                      {/* Timer Badge */}
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-card shadow-lg border border-border flex items-center gap-2 ${timeLeft <= 60 ? 'text-destructive' : timeLeft <= 120 ? 'text-warning' : 'text-success'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">Oficina Central</span>
                    </div>

                    {/* Regenerate Button */}
                    <Button variant="outline" onClick={generateQR} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Regenerar código
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      El código se regenera automáticamente cada 5 minutos
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Live Status Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Monitor en Vivo
            </CardTitle>
            <CardDescription>Estado actual de asistencia de empleados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Empleado</TableHead>
                    <TableHead className="font-semibold">Hora Entrada</TableHead>
                    <TableHead className="font-semibold">Hora Salida</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Local</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEmployees.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={employee.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{employee.entryTime}</TableCell>
                      <TableCell className="font-mono">
                        {employee.exitTime || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-sm">{employee.location}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
