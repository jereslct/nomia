import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, Enums } from "@/integrations/supabase/types";

type DocumentCategory = Enums<"document_category">;
type DocumentStatus = Enums<"document_status">;

export type EmployeeDocument = Tables<"employee_documents"> & {
  profiles?: { full_name: string } | null;
};

interface UploadDocumentParams {
  file: File;
  category: DocumentCategory;
  description?: string;
  userId?: string;
}

export function useEmployeeDocuments(userId?: string) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchOrganizationId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    if (isAdmin) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      return data?.[0]?.id || null;
    }

    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .maybeSingle();
    return data?.organization_id || null;
  }, [user, isAdmin]);

  const fetchDocuments = useCallback(async () => {
    if (authLoading || !user) return;

    try {
      setLoading(true);
      const orgId = await fetchOrganizationId();
      setOrganizationId(orgId);

      if (!orgId) {
        setDocuments([]);
        return;
      }

      let query = supabase
        .from("employee_documents")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      } else if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching documents:", error);
        setDocuments([]);
        return;
      }

      setDocuments((data as unknown as EmployeeDocument[]) || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading, userId, fetchOrganizationId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchDocuments();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchDocuments]);

  const uploadDocument = useCallback(
    async ({ file, category, description, userId: targetUserId }: UploadDocumentParams) => {
      if (!user || !organizationId) throw new Error("No autenticado o sin organización");

      const targetUser = targetUserId || user.id;
      const timestamp = Date.now();
      const filePath = `${organizationId}/${targetUser}/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("employee-documents")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from("employee_documents")
        .insert({
          user_id: targetUser,
          organization_id: organizationId,
          category,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          description: description || null,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      await fetchDocuments();
    },
    [user, organizationId, fetchDocuments],
  );

  const updateDocumentStatus = useCallback(
    async ({ id, status }: { id: string; status: DocumentStatus }) => {
      const { error } = await supabase
        .from("employee_documents")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      await fetchDocuments();
    },
    [fetchDocuments],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) throw new Error("Documento no encontrado");

      // Extract storage path from the public URL
      const url = new URL(doc.file_url);
      const storagePath = url.pathname.split("/employee-documents/").pop();

      if (storagePath) {
        await supabase.storage.from("employee-documents").remove([decodeURIComponent(storagePath)]);
      }

      const { error } = await supabase.from("employee_documents").delete().eq("id", id);

      if (error) throw error;

      await fetchDocuments();
    },
    [documents, fetchDocuments],
  );

  return {
    documents,
    loading,
    organizationId,
    uploadDocument,
    updateDocumentStatus,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
