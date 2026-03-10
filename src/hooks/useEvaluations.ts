import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface Criterion {
  name: string;
  weight: number;
}

export interface EvaluationTemplate {
  id: string;
  organization_id: string;
  name: string;
  criteria: Criterion[];
  created_by: string;
  created_at: string;
}

export type EvaluationStatus = "draft" | "completed" | "shared";

export interface PerformanceEvaluation {
  id: string;
  template_id: string;
  user_id: string;
  evaluator_id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  scores: Record<string, number>;
  overall_score: number | null;
  comments: string | null;
  status: EvaluationStatus;
  shared_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string } | null;
  evaluation_templates?: { name: string; criteria: Criterion[] } | null;
}

interface CreateTemplateParams {
  name: string;
  criteria: Criterion[];
}

interface CreateEvaluationParams {
  templateId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
}

interface UpdateEvaluationParams {
  id: string;
  scores: Record<string, number>;
  overallScore: number;
  comments?: string;
  status: EvaluationStatus;
}

export function useEvaluations() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
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

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;
    setLoading(true);

    try {
      const orgId = await fetchOrganizationId();
      setOrganizationId(orgId);
      if (!orgId) {
        setTemplates([]);
        setEvaluations([]);
        return;
      }

      if (isAdmin) {
        const { data: templatesData } = await supabase
          .from("evaluation_templates")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false });

        setTemplates(
          (templatesData || []).map((t: Record<string, unknown>) => ({
            ...t,
            id: t.id as string,
            organization_id: t.organization_id as string,
            name: t.name as string,
            criteria: (t.criteria || []) as Criterion[],
            created_by: t.created_by as string,
            created_at: t.created_at as string,
          })) as EvaluationTemplate[],
        );
      }

      let evalQuery = supabase
        .from("performance_evaluations")
        .select("*, profiles!performance_evaluations_user_id_fkey(full_name), evaluation_templates!performance_evaluations_template_id_fkey(name, criteria)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        evalQuery = evalQuery.eq("user_id", user.id).eq("status", "shared");
      }

      const { data: evalsData, error } = await evalQuery;
      if (error) throw error;

      const mapped: PerformanceEvaluation[] = (evalsData || []).map(
        (e: Record<string, unknown>) => {
          const tpl = e.evaluation_templates as Record<string, unknown> | null;
          return {
            id: e.id as string,
            template_id: e.template_id as string,
            user_id: e.user_id as string,
            evaluator_id: e.evaluator_id as string,
            organization_id: e.organization_id as string,
            period_start: e.period_start as string,
            period_end: e.period_end as string,
            scores: (e.scores || {}) as Record<string, number>,
            overall_score: e.overall_score as number | null,
            comments: e.comments as string | null,
            status: e.status as EvaluationStatus,
            shared_at: e.shared_at as string | null,
            created_at: e.created_at as string,
            updated_at: e.updated_at as string,
            profiles: e.profiles as { full_name: string } | null,
            evaluation_templates: tpl
              ? { name: tpl.name as string, criteria: (tpl.criteria || []) as Criterion[] }
              : null,
          };
        },
      );
      setEvaluations(mapped);
    } catch (err) {
      console.error("Error fetching evaluations:", err);
      setTemplates([]);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading, fetchOrganizationId]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  const createTemplate = useCallback(
    async (params: CreateTemplateParams) => {
      if (!user || !organizationId) return { error: "Sin organización" };

      const { error } = await supabase.from("evaluation_templates").insert({
        organization_id: organizationId,
        name: params.name,
        criteria: params.criteria as unknown as Json,
        created_by: user.id,
      });

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [user, organizationId, fetchData],
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("evaluation_templates")
        .delete()
        .eq("id", id);

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [fetchData],
  );

  const createEvaluation = useCallback(
    async (params: CreateEvaluationParams) => {
      if (!user || !organizationId) return { error: "Sin organización" };

      const { error } = await supabase.from("performance_evaluations").insert({
        template_id: params.templateId,
        user_id: params.userId,
        evaluator_id: user.id,
        organization_id: organizationId,
        period_start: params.periodStart,
        period_end: params.periodEnd,
        scores: {} as unknown as Json,
        status: "draft",
      });

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [user, organizationId, fetchData],
  );

  const updateEvaluation = useCallback(
    async (params: UpdateEvaluationParams) => {
      const { error } = await supabase
        .from("performance_evaluations")
        .update({
          scores: params.scores as unknown as Json,
          overall_score: params.overallScore,
          comments: params.comments || null,
          status: params.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [fetchData],
  );

  const shareEvaluation = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("performance_evaluations")
        .update({
          status: "shared",
          shared_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (!error) await fetchData();
      return { error: error?.message || null };
    },
    [fetchData],
  );

  return {
    templates,
    evaluations,
    loading,
    organizationId,
    createTemplate,
    deleteTemplate,
    createEvaluation,
    updateEvaluation,
    shareEvaluation,
    refetch: fetchData,
  };
}
