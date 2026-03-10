import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Search,
  FileText,
  Loader2,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePayStubs } from "@/hooks/usePayStubs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface OrgMember {
  user_id: string;
  full_name: string;
  email: string;
}

const AdminPayStubs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { payStubs, loading, uploadPayStub, deletePayStub, refetch } =
    usePayStubs();

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user) return;
      setLoadingMembers(true);
      try {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id);

        if (!orgs || orgs.length === 0) {
          setMembers([]);
          return;
        }

        const orgIds = orgs.map((o) => o.id);

        const { data: orgMembers } = await supabase
          .from("organization_members")
          .select("user_id")
          .in("organization_id", orgIds)
          .eq("status", "accepted")
          .not("user_id", "is", null);

        if (!orgMembers || orgMembers.length === 0) {
          setMembers([]);
          return;
        }

        const userIds = [
          ...new Set(
            orgMembers.map((m) => m.user_id).filter(Boolean) as string[]
          ),
        ];

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);

        setMembers(
          (profiles || []).map((p) => ({
            user_id: p.user_id,
            full_name: p.full_name || p.email,
            email: p.email,
          }))
        );
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [user]);

  const handleUpload = async () => {
    if (!selectedEmployee || !selectedMonth || !selectedYear || !selectedFile) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completá todos los campos.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      await uploadPayStub({
        file: selectedFile,
        userId: selectedEmployee,
        periodMonth: Number(selectedMonth),
        periodYear: Number(selectedYear),
      });
      setDialogOpen(false);
      resetUploadForm();
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedEmployee("");
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear().toString());
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    await deletePayStub(id);
  };

  const stats = useMemo(() => {
    const total = payStubs.length;
    const downloaded = payStubs.filter((ps) => ps.downloaded_at).length;
    const pending = total - downloaded;
    return { total, downloaded, pending };
  }, [payStubs]);

  const availableYears = useMemo(() => {
    const years = new Set(payStubs.map((ps) => ps.period_year));
    return Array.from(years).sort((a, b) => b - a);
  }, [payStubs]);

  const filteredPayStubs = useMemo(() => {
    return payStubs.filter((ps) => {
      if (filterYear !== "all" && ps.period_year !== Number(filterYear))
        return false;
      if (filterMonth !== "all" && ps.period_month !== Number(filterMonth))
        return false;
      if (searchQuery) {
        const name =
          ps.profiles?.full_name?.toLowerCase() ||
          ps.profiles?.email?.toLowerCase() ||
          "";
        if (!name.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [payStubs, filterYear, filterMonth, searchQuery]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading && loadingMembers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Recibos de Sueldo
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestioná los recibos de sueldo de tus empleados
              </p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Subir Recibo
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-blue-100 p-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total subidos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.downloaded}</p>
                <p className="text-sm text-gray-500">Descargados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-amber-100 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar empleado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los años</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los meses</SelectItem>
                  {MONTH_NAMES.map((name, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {filteredPayStubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText className="h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-600 mb-1">
                  No hay recibos
                </h3>
                <p className="text-sm text-gray-400">
                  {payStubs.length === 0
                    ? "Subí el primer recibo de sueldo con el botón de arriba."
                    : "No se encontraron recibos con los filtros seleccionados."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Archivo
                      </TableHead>
                      <TableHead>Descargado</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Fecha Subida
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayStubs.map((stub) => (
                      <TableRow key={stub.id}>
                        <TableCell className="font-medium">
                          {stub.profiles?.full_name || "—"}
                        </TableCell>
                        <TableCell>
                          {MONTH_NAMES[stub.period_month - 1]} {stub.period_year}
                        </TableCell>
                        <TableCell
                          className="hidden sm:table-cell max-w-[200px] truncate"
                          title={stub.file_name}
                        >
                          {stub.file_name}
                        </TableCell>
                        <TableCell>
                          {stub.downloaded_at ? (
                            <span className="text-sm text-green-600">
                              {new Date(stub.downloaded_at).toLocaleDateString(
                                "es-AR"
                              )}
                            </span>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-700"
                            >
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">
                          {new Date(stub.created_at).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(stub.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetUploadForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Recibo de Sueldo</DialogTitle>
            <DialogDescription>
              Seleccioná el empleado, período y archivo a subir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Mes</Label>
                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Año</Label>
                <Select
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Archivo</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Subir Recibo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayStubs;
