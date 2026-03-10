import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PayStub {
  id: string;
  user_id: string;
  organization_id: string;
  period_month: number;
  period_year: number;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  downloaded_at: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface UploadPayStubParams {
  file: File;
  userId: string;
  periodMonth: number;
  periodYear: number;
}

export const usePayStubs = (userId?: string) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [payStubs, setPayStubs] = useState<PayStub[]>([]);
  const [loading, setLoading] = useState(true);

  const getOrganizationId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    if (isAdmin) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      return data?.[0]?.id ?? null;
    }

    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .limit(1);
    return data?.[0]?.organization_id ?? null;
  }, [user, isAdmin]);

  const fetchPayStubs = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const orgId = await getOrganizationId();
      if (!orgId) {
        setPayStubs([]);
        return;
      }

      let query = supabase
        .from("pay_stubs")
        .select("*")
        .eq("organization_id", orgId)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      } else if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayStubs((data as unknown as PayStub[]) || []);
    } catch (error) {
      console.error("Error fetching pay stubs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los recibos de sueldo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, userId, isAdmin, getOrganizationId, toast]);

  useEffect(() => {
    fetchPayStubs();
  }, [fetchPayStubs]);

  const uploadPayStub = async ({
    file,
    userId: targetUserId,
    periodMonth,
    periodYear,
  }: UploadPayStubParams) => {
    if (!user) return;

    try {
      const orgId = await getOrganizationId();
      if (!orgId) throw new Error("No se encontró la organización.");

      const filePath = `${orgId}/${targetUserId}/${periodYear}_${periodMonth}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("pay-stubs")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("pay-stubs")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("pay_stubs").insert({
        user_id: targetUserId,
        organization_id: orgId,
        period_month: periodMonth,
        period_year: periodYear,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      toast({
        title: "Recibo subido",
        description: "El recibo de sueldo se subió correctamente.",
      });

      await fetchPayStubs();
    } catch (error: unknown) {
      console.error("Error uploading pay stub:", error);
      toast({
        title: "Error al subir",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo subir el recibo de sueldo.",
        variant: "destructive",
      });
    }
  };

  const markAsDownloaded = async (id: string) => {
    try {
      const { error } = await supabase
        .from("pay_stubs")
        .update({ downloaded_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setPayStubs((prev) =>
        prev.map((ps) =>
          ps.id === id
            ? { ...ps, downloaded_at: new Date().toISOString() }
            : ps
        )
      );
    } catch (error) {
      console.error("Error marking as downloaded:", error);
    }
  };

  const deletePayStub = async (id: string) => {
    try {
      const stub = payStubs.find((ps) => ps.id === id);
      if (!stub) return;

      const filePath = `${stub.organization_id}/${stub.user_id}/${stub.period_year}_${stub.period_month}_${stub.file_name}`;
      await supabase.storage.from("pay-stubs").remove([filePath]);

      const { error } = await supabase.from("pay_stubs").delete().eq("id", id);

      if (error) throw error;

      setPayStubs((prev) => prev.filter((ps) => ps.id !== id));

      toast({
        title: "Recibo eliminado",
        description: "El recibo de sueldo fue eliminado correctamente.",
      });
    } catch (error) {
      console.error("Error deleting pay stub:", error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el recibo de sueldo.",
        variant: "destructive",
      });
    }
  };

  return {
    payStubs,
    loading,
    uploadPayStub,
    markAsDownloaded,
    deletePayStub,
    refetch: fetchPayStubs,
  };
};
