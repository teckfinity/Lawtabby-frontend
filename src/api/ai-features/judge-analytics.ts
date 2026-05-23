/**
 * ai-features/judge-analytics.ts
 * ────────────────────────────────
 * All Judge Analytics API calls.
 */
import { aiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JudgeListParams {
  limit?: number;
  offset?: number;
  search?: string;
  backfill_all?: boolean;
}

export interface JudgeListResponse {
  results: JudgeListItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface JudgeListItem {
  id: number;
  judge_id: number;
  full_name: string;
  court_name: string;
  specialty: string;
  grant_rate: number;
  total_cases: number;
  avg_decision_time: number;
  recent_cases_count: number;
}

export interface AnalyticsSummary {
  judges_analyzed: number;
  cases_tracked: number;
  courts_covered: number;
  success_rate: number;
}

export interface AnalyticsOverview {
  quick_insights: Array<{ title: string; description: string; metric: string }>;
  ai_prediction_teaser: {
    title: string;
    description: string;
    available_judges: number;
    accuracy_rate: number;
    cta_text: string;
  };
}

export interface CaseTypeAnalysisItem {
  category: string;
  total_cases: number;
  granted_percentage: number | null;
  denied_percentage: number | null;
  no_outcome_data: boolean;
}

export interface JudgePredictPayload {
  case_type: string;
  client_position: string;
  case_description: string;
  key_facts: string[];
}

export interface CaseHistoryParams {
  search?: string;
  case_type?: string;
  status?: string;
  limit?: number;
  page?: number;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const getJudgesList = (params: JudgeListParams = {}) => {
  const query: Record<string, unknown> = {
    limit: params.limit ?? 3,
    offset: params.offset ?? 0,
  };
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.backfill_all) query.backfill_all = "1";
  return aiClient.get<JudgeListResponse>("/api/judges/", { params: query });
};

export const getJudgeAnalyticsSummary = () =>
  aiClient.get<AnalyticsSummary>("/api/judge-analytics/summary/");

export const getJudgeAnalyticsOverview = () =>
  aiClient.get<AnalyticsOverview>("/api/judge-analytics/overview/");

export const getCaseTypeAnalysis = (options?: { backfill?: boolean }) =>
  aiClient.get<CaseTypeAnalysisItem[]>("/api/cases/type-analysis/", {
    params: options?.backfill ? { backfill: "1" } : {},
  });

export const getQuickInsights = () =>
  aiClient.get("/api/insights/quick/");

export const getJudgeProfile = (judgeId: number) =>
  aiClient.get(`/api/judges/${judgeId}/profile/`);

export const getJudgeCaseHistory = (judgeId: number, params: CaseHistoryParams = {}) =>
  aiClient.get(`/api/judges/${judgeId}/case-history/`, { params });

export const postJudgePredictOutcome = (judgeId: number, payload: JudgePredictPayload) =>
  aiClient.post(`/api/judges/${judgeId}/predict/`, payload);

export const getJudgePredictionContext = (judgeId: number) =>
  aiClient.get(`/api/judges/${judgeId}/prediction_context/`);

export const getJudgeHistoricalPerformance = (judgeId: number) =>
  aiClient.get(`/api/judges/${judgeId}/historical_performance/`);

export const getJudgeCaseDistribution = (judgeId: number) =>
  aiClient.get(`/api/judges/${judgeId}/case_distribution/`);

export const getJudgePatterns = (judgeId: number) =>
  aiClient.get(`/api/judges/${judgeId}/patterns/`);
