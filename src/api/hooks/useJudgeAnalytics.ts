/**
 * api/hooks/useJudgeAnalytics.ts
 * ────────────────────────────────
 * React Query hooks for all Judge Analytics data.
 *
 * Caching strategy:
 *   - summary / overview / caseTypes : staleTime 5 min (server also caches 5 min)
 *   - judge list                      : staleTime 5 min (version-keyed on server)
 *   - judge profile                   : staleTime 3 min
 *   - case history                    : staleTime 2 min
 *   - prediction / historical         : staleTime 5 min
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "./keys";
import {
  getJudgesList,
  getJudgeAnalyticsSummary,
  getJudgeAnalyticsOverview,
  getCaseTypeAnalysis,
  getQuickInsights,
  getJudgeProfile,
  getJudgeCaseHistory,
  postJudgePredictOutcome,
  getJudgePredictionContext,
  getJudgeHistoricalPerformance,
  getJudgeCaseDistribution,
  getJudgePatterns,
  type JudgePredictPayload,
  type CaseHistoryParams,
} from "@/api/ai-features/judge-analytics";

const STALE_5MIN = 5 * 60 * 1000;
const STALE_3MIN = 3 * 60 * 1000;
const STALE_2MIN = 2 * 60 * 1000;

// ─── Dashboard / List ─────────────────────────────────────────────────────────

export function useJudgesList(params: { limit?: number; offset?: number; search?: string } = {}) {
  const p = { limit: params.limit ?? 3, offset: params.offset ?? 0, search: params.search };
  return useQuery({
    queryKey: queryKeys.judges.list(p),
    queryFn: async () => {
      const res = await getJudgesList(p);
      return res.data;
    },
    staleTime: STALE_5MIN,
    placeholderData: (prev) => prev, // keep previous data while refetching (no flicker on page change)
  });
}

export function useJudgeAnalyticsSummary() {
  return useQuery({
    queryKey: queryKeys.judges.summary(),
    queryFn: async () => (await getJudgeAnalyticsSummary()).data,
    staleTime: STALE_5MIN,
  });
}

export function useJudgeAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.judges.overview(),
    queryFn: async () => (await getJudgeAnalyticsOverview()).data,
    staleTime: STALE_5MIN,
  });
}

export function useCaseTypeAnalysis(options?: { backfill?: boolean }) {
  return useQuery({
    queryKey: queryKeys.judges.caseTypes(),
    queryFn: async () => (await getCaseTypeAnalysis(options)).data,
    staleTime: STALE_5MIN,
  });
}

export function useQuickInsights() {
  return useQuery({
    queryKey: queryKeys.judges.insights(),
    queryFn: async () => (await getQuickInsights()).data,
    staleTime: STALE_5MIN,
  });
}

// ─── Judge Profile ────────────────────────────────────────────────────────────

export function useJudgeProfile(judgeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.judges.profile(judgeId!),
    queryFn: async () => (await getJudgeProfile(judgeId!)).data,
    enabled: !!judgeId,
    staleTime: STALE_3MIN,
  });
}

export function useJudgeCaseDistribution(judgeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.judges.distribution(judgeId!),
    queryFn: async () => (await getJudgeCaseDistribution(judgeId!)).data,
    enabled: !!judgeId,
    staleTime: STALE_3MIN,
  });
}

export function useJudgePatterns(judgeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.judges.patterns(judgeId!),
    queryFn: async () => (await getJudgePatterns(judgeId!)).data,
    enabled: !!judgeId,
    staleTime: STALE_3MIN,
  });
}

// ─── Case History ─────────────────────────────────────────────────────────────

export function useJudgeCaseHistory(judgeId: number | undefined, params: CaseHistoryParams = {}) {
  return useQuery({
    queryKey: queryKeys.judges.caseHistory(judgeId!, params),
    queryFn: async () => (await getJudgeCaseHistory(judgeId!, params)).data,
    enabled: !!judgeId,
    staleTime: STALE_2MIN,
    placeholderData: (prev) => prev,
  });
}

// ─── Judge Predictions ────────────────────────────────────────────────────────

export function useJudgePredictionContext(judgeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.judges.prediction(judgeId!),
    queryFn: async () => (await getJudgePredictionContext(judgeId!)).data,
    enabled: !!judgeId,
    staleTime: STALE_5MIN,
  });
}

export function useJudgeHistoricalPerformance(judgeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.judges.historical(judgeId!),
    queryFn: async () => (await getJudgeHistoricalPerformance(judgeId!)).data,
    enabled: !!judgeId,
    staleTime: STALE_5MIN,
  });
}

export function useJudgePredictOutcome(judgeId: number | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: JudgePredictPayload) =>
      postJudgePredictOutcome(judgeId!, payload).then((r) => r.data),

    onSuccess: () => {
      // Invalidate profile & prediction context so sidebar updates
      if (judgeId) {
        qc.invalidateQueries({ queryKey: queryKeys.judges.profile(judgeId) });
      }
    },

    onError: () => {
      toast({
        title: "Prediction failed",
        description: "Unable to generate prediction. Please try again.",
        variant: "destructive",
      });
    },
  });
}
