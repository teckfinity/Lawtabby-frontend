// src/api/Ai_Features_Microsrc/judge_analytcs.ts

import { apiClient } from "./ai_mics_config";

/**
 * GET: List of Judges with pagination and search
 * Endpoint: /api/judges/
 * Query Params: limit, offset, search, backfill_all (1 = one-time backfill all judges for Grant Rate / Avg Decision / Case Type)
 * Response: { results: [...], pagination: { limit, offset, total, has_next, has_previous } }
 */
export const getJudgesList = ({
  limit = 3,
  offset = 0,
  search,
  backfill_all,
}: {
  limit?: number;
  offset?: number;
  search?: string;
  backfill_all?: boolean;
}) => {
  const params: Record<string, any> = {
    limit,
    offset,
  };

  if (search && search.trim().length > 0) {
    params.search = search.trim();
  }
  if (backfill_all) {
    params.backfill_all = "1";
  }

  return apiClient.get("/api/judges/", {
    params,
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: cases/type-analysis/
   backfill=1: run AI extraction for categories with no outcome and store to DB
--------------------------------------------------------- */
export const getCaseTypeAnalysis = (options?: { backfill?: boolean }) => {
  const params: Record<string, string> = {};
  if (options?.backfill) params.backfill = "1";
  return apiClient.get("/api/cases/type-analysis/", {
    params,
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   NEW: GET: Quick Insights for homepage
   Endpoint: /api/insights/quick/
--------------------------------------------------------- */
export const getQuickInsights = () => {
  return apiClient.get("/api/insights/quick/", {
    headers: { "Content-Type": "application/json" },
  });
};

/* GET: Unified Judge Profile */
export const getJudgeProfile = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/profile/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   POST: judge predictive ai
--------------------------------------------------------- */
export const postJudgePredictOutcome = (
  judgeId: number,
  payload: {
    case_type: string;
    client_position: string;
    case_description: string;
    key_facts: string[];
  }
) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.post(`/api/judges/${judgeId}/predict/`, payload, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: judge case history
--------------------------------------------------------- */
export const getJudgeCaseHistory = (
  judgeId: number,
  params: {
    search?: string;
    case_type?: string;
    status?: string;
    limit?: number;
    page?: number;
  } = {}
) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/case-history/`, {
    params,
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Analytics Summary (top stats cards)
   Endpoint: /api/judge-analytics/summary/
--------------------------------------------------------- */
export const getJudgeAnalyticsSummary = () => {
  return apiClient.get("/api/judge-analytics/summary/", {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Analytics Overview (right panel data)
   Endpoint: /api/judge-analytics/overview/
--------------------------------------------------------- */
export const getJudgeAnalyticsOverview = () => {
  return apiClient.get("/api/judge-analytics/overview/", {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Stats by ID
--------------------------------------------------------- */
export const getJudgeStats = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/stats/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Case Distribution by Category
--------------------------------------------------------- */
export const getJudgeCaseDistribution = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/case_distribution/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Insights
--------------------------------------------------------- */
export const getJudgeInsights = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/insights/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Old Analytics Data
--------------------------------------------------------- */
export const getJudgeOldAnalytics = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/analytics_old/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Prediction Context
   Endpoint: /api/judges/{judge_id}/prediction_context/
--------------------------------------------------------- */
export const getJudgePredictionContext = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/prediction_context/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Historical Performance
   Endpoint: /api/judges/{judge_id}/historical_performance/
--------------------------------------------------------- */
export const getJudgeHistoricalPerformance = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/historical_performance/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Decision Patterns & Behavioral Analysis
   Endpoint: /api/judges/{judge_id}/patterns/
--------------------------------------------------------- */
export const getJudgePatterns = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/patterns/`, {
    headers: { "Content-Type": "application/json" },
  });
};