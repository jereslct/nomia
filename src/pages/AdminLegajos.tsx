import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowLeft,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { useEmployeeDocuments, type EmployeeDocument } from "@/hooks/useEmployeeDocuments";
import { useToast } from "@/hooks/use-toast";
import type { Enums } from "@/integrations/supabase/types";

type DocumentCategory = Enums<"document_category">;
type DocumentStatus = Enums<"document_status">;

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  curriculum: "Currículum",
  arca_registration: "Alta ARCA",
  signed_receipt: "Recibo Firmado",
  other: "Otro",
};

const STATUS_CONFIG: Record<DocumentStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface OrgMember {
  user_id: string;
  full_name: string;
}

export default function AdminLegajos() {
  const { user } = useAuth();
  const { documents, loading, organizationId, uploadDocument, updateDocumentStatus } = useEmployeeDocuments();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [uploadUserId, setUploadUserId] = useState("");
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>("other");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch members for the upload dialog
  const fetchMembers = useCallback(async () => {
    if (!organizationId) return;
    setLoadingMembers(true);
    try {
      const { data } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId)
        .eq("status", "accepted");

      const userIds = data?.map((m) => m.user_id).filter(Boolean) as string[];
      if (!userIds?.length) { setMembers([]); return; }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      setMembers((profiles || []).map((p) => ({ user_id: p.user_id, full_name: p.full_name })));
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) fetchMembers();
  }, [organizationId, fetchMembers]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const nameMatch =
        !searchQuery ||
        (doc.profiles?.full_name ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const catMatch = categoryFilter === "all" || doc.category === categoryFilter;
      const statusMatch = statusFilter === "all" || doc.status === statusFilter;
      return nameMatch && catMatch && statusMatch;
    });
  }, [documents, searchQuery, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = documents.length;
    const pending = documents.filter((d) => d.status === "pending").length;
    const byCategory: Record<string, number> = {};
    for (const doc of documents) {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    }
    return { total, pending, byCategory };
  }, [documents]);

  const handleStatusChange = async (id: string, status: DocumentStatus) => {
    try {
      await updateDocumentStatus({ id, status });
      toast({ title: status === "approved" ? "Documento aprobado" : "Documento rechazado" });
    } catch {
      toast({ title: "Error al actualizar el estado", variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadUserId) return;
    setUploading(true);
    try {
      await uploadDocument({
        file: uploadFile,
        category: uploadCategory,
        description: uploadDescription || undefined,
        userId: uploadUserId,
      });
      toast({ title: "Documento cargado", description: "El documento fue subido correctamente." });
      setUploadOpen(false);
      resetUploadForm();
    } catch (err: any) {
      toast({ title: "Error al subir documento", description: err?.message || "Intente nuevamente.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadUserId("");
    setUploadCategory("other");
    setUploadDescription("");
    setUploadFile(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.ADMIN}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Legajos</h1>
              <p className="text-sm text-muted-foreground">
                Gestión de documentos de empleados
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Cargar documento</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendientes de revisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Currículum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.byCategory["curriculum"] || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recibos Firmados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.byCategory["signed_receipt"] || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de empleado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="curriculum">Currículum</SelectItem>
              <SelectItem value="arca_registration">Alta ARCA</SelectItem>
              <SelectItem value="signed_receipt">Recibo Firmado</SelectItem>
              <SelectItem value="other">Otro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No se encontraron documentos</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {doc.profiles?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate text-sm">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[doc.category]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_CONFIG[doc.status].variant}>
                          {STATUS_CONFIG[doc.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(doc.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalles"
                            onClick={() => setSelectedDoc(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Descargar" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          {doc.status !== "approved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Aprobar"
                              onClick={() => handleStatusChange(doc.id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {doc.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Rechazar"
                              onClick={() => handleStatusChange(doc.id, "rejected")}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => { if (!open) setSelectedDoc(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del documento</DialogTitle>
            <DialogDescription>
              Información completa del documento seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Empleado</p>
                  <p className="font-medium">{selectedDoc.profiles?.full_name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categoría</p>
                  <Badge variant="outline">
                    {CATEGORY_LABELS[selectedDoc.category]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <Badge variant={STATUS_CONFIG[selectedDoc.status].variant}>
                    {STATUS_CONFIG[selectedDoc.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de carga</p>
                  <p className="font-medium">{formatDate(selectedDoc.created_at)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Archivo</p>
                  <p className="font-medium">{selectedDoc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedDoc.file_size)}
                  </p>
                </div>
                {selectedDoc.description && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Descripción</p>
                    <p className="font-medium">{selectedDoc.description}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" asChild>
                  <a href={selectedDoc.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </a>
                </Button>
                {selectedDoc.status !== "approved" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedDoc.id, "approved");
                      setSelectedDoc(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Aprobar
                  </Button>
                )}
                {selectedDoc.status !== "rejected" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedDoc.id, "rejected");
                      setSelectedDoc(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Rechazar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) { setUploadOpen(false); resetUploadForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cargar documento</DialogTitle>
            <DialogDescription>
              Subí un documento al legajo de un empleado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              {loadingMembers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando empleados...
                </div>
              ) : (
                <Select value={uploadUserId} onValueChange={setUploadUserId}>
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
              )}
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocumentCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="curriculum">Currículum</SelectItem>
                  <SelectItem value="arca_registration">Alta ARCA</SelectItem>
                  <SelectItem value="signed_receipt">Recibo Firmado</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder="Descripción del documento..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Archivo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                {uploadFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{uploadFile.name}</span>
                      <span className="text-muted-foreground">({formatFileSize(uploadFile.size)})</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setUploadFile(null)}>
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Hacé clic para seleccionar un archivo</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUploadFile(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setUploadOpen(false); resetUploadForm(); }}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!uploadFile || !uploadUserId || uploading}
                onClick={handleUpload}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Subir documento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
