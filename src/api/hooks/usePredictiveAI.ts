/**
 * api/hooks/usePredictiveAI.ts
 * ──────────────────────────────
 * React Query hooks for Predictive AI.
 *
 * Caching:
 *   - stats / case rates : 5 min (server also caches 5 min)
 *   - drafts list        : 30 s  (user-specific, changes on save)
 *   - draft detail       : 2 min
 *
 * Mutations:
 *   - useRunPrediction   : no auto-save, caller decides
 *   - useSaveDraft       : invalidates draft list → sidebar refreshes
 *   - useDeleteDraft     : optimistic removal + rollback on error
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "./keys";
import {
  getPlatformStats,
  getCaseTypeRates,
  runPrediction,
  savePredictionDraft,
  getPredictionDrafts,
  getPredictionDraftDetail,
  deletePredictionDraft,
  type PredictPayload,
  type SaveDraftPayload,
  type PredictionDraftSummary,
} from "@/api/ai-features/predictive-ai";

const STALE_5MIN = 5 * 60 * 1000;
const STALE_30S  = 30 * 1000;
const STALE_2MIN = 2 * 60 * 1000;

const isAuth = () => !!localStorage.getItem("authToken");

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePlatformStats() {
  return useQuery({
    queryKey: queryKeys.predictiveAI.stats(),
    queryFn: async () => (await getPlatformStats()).data.data,
    staleTime: STALE_5MIN,
    retry: 2,
  });
}

export function useCaseTypeRates() {
  return useQuery({
    queryKey: queryKeys.predictiveAI.caseRates(),
    queryFn: async () => (await getCaseTypeRates()).data.data,
    staleTime: STALE_5MIN,
    retry: 2,
  });
}

export function usePredictionDrafts(limit = 20) {
  return useQuery({
    queryKey: queryKeys.predictiveAI.drafts(),
    queryFn: async () => (await getPredictionDrafts(limit)).data.data,
    enabled: isAuth(),
    staleTime: STALE_30S,
    retry: 1,
  });
}

export function usePredictionDraftDetail(draftId: number | null) {
  return useQuery({
    queryKey: queryKeys.predictiveAI.draft(draftId!),
    queryFn: async () => (await getPredictionDraftDetail(draftId!)).data.data,
    enabled: !!draftId,
    staleTime: STALE_2MIN,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useRunPrediction() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: PredictPayload) =>
      runPrediction(payload).then((r) => r.data.data),
    onError: () => {
      toast({
        title: "Prediction failed",
        description: "Unable to generate prediction. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useSaveDraft() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (payload: SaveDraftPayload) =>
      savePredictionDraft(payload).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.predictiveAI.drafts() });
      toast({ title: "Saved", description: "Prediction saved to your Recent Predictions." });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Could not save. Make sure you are signed in.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (draftId: number) => deletePredictionDraft(draftId),

    // Optimistic update
    onMutate: async (draftId: number) => {
      await qc.cancelQueries({ queryKey: queryKeys.predictiveAI.drafts() });
      const previous = qc.getQueryData<PredictionDraftSummary[]>(queryKeys.predictiveAI.drafts());
      qc.setQueryData<PredictionDraftSummary[]>(
        queryKeys.predictiveAI.drafts(),
        (old) => old?.filter((d) => d.id !== draftId) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(queryKeys.predictiveAI.drafts(), ctx.previous);
      toast({ title: "Delete failed", description: "Could not delete prediction.", variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.predictiveAI.drafts() });
    },
  });
}
