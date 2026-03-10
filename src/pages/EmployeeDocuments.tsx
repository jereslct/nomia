import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeeDocuments, type EmployeeDocument } from "@/hooks/useEmployeeDocuments";
import { useToast } from "@/hooks/use-toast";
import type { Enums } from "@/integrations/supabase/types";

type DocumentCategory = Enums<"document_category">;

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  curriculum: "Currículum",
  arca_registration: "Alta ARCA",
  signed_receipt: "Recibo Firmado",
  other: "Otro",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
};

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function EmployeeDocuments() {
  const { user, loading: authLoading } = useAuth();
  const { documents, loading, uploadDocument, deleteDocument } = useEmployeeDocuments();
  const { toast } = useToast();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("curriculum");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const filteredDocuments =
    activeTab === "all"
      ? documents
      : documents.filter((d) => d.category === activeTab);

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "El archivo excede el límite de 10MB", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext || "")) {
      toast({ title: "Formato no permitido. Usá PDF, JPG o PNG", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await uploadDocument({
        file: selectedFile,
        category: selectedCategory,
        description: description.trim() || undefined,
      });
      toast({ title: "Documento subido correctamente" });
      resetUploadForm();
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Error al subir el documento", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: EmployeeDocument) => {
    try {
      await deleteDocument(doc.id);
      toast({ title: "Documento eliminado" });
    } catch {
      toast({ title: "Error al eliminar el documento", variant: "destructive" });
    }
  };

  const resetUploadForm = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDescription("");
    setSelectedCategory("curriculum");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg flex-1">Mi Legajo</h1>
          <Button onClick={() => setUploadDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Subir documento</span>
            <span className="sm:hidden">Subir</span>
          </Button>
        </div>
      </header>
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="curriculum">Currículum</TabsTrigger>
            <TabsTrigger value="arca_registration">Alta ARCA</TabsTrigger>
            <TabsTrigger value="signed_receipt">Recibos Firmados</TabsTrigger>
            <TabsTrigger value="other">Otros</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay documentos en esta categoría</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex-shrink-0">
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.file_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {CATEGORY_LABELS[doc.category]}
                          </Badge>
                          <Badge variant={STATUS_CONFIG[doc.status]?.variant ?? "secondary"}>
                            {STATUS_CONFIG[doc.status]?.label ?? doc.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.file_size)} · {formatDate(doc.created_at)}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {doc.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        {doc.uploaded_by === user.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { if (!open) resetUploadForm(); else setUploadDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir documento</DialogTitle>
            <DialogDescription>
              Seleccioná un archivo PDF, JPG o PNG (máx. 10MB)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v as DocumentCategory)}
              >
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
              <Label>Archivo</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arrastrá un archivo o hacé clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, JPG, PNG — máx. 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agregá una descripción breve..."
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir documento
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
