import { apiClient } from "./ai_mics_config";


export const getJudgesList = ({
  page = 1,
  limit = 3,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const params: Record<string, any> = {
    page,
    limit,
  };

  //  Only add search if it has value
  if (search && search.trim().length > 0) {
    params.search = search.trim();
  }

  return apiClient.get("/api/judges/", {
    params,
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Fetch Complete Judge Profile by ID
--------------------------------------------------------- */
export const getJudgeCompleteProfile = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/complete_profile/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   NEW: Get Judge Analytics Summary (for top cards)
--------------------------------------------------------- */
export const getJudgeAnalyticsSummary = () => {
  return apiClient.get("/api/judge-analytics/summary/", {
    headers: { "Content-Type": "application/json" },
  });
};


/* ---------------------------------------------------------
   NEW: Get Judge Analytics Overview 
   Endpoint: /judge-analytics/overview/
   Used for: Case Type Analysis, Quick Insights, AI Prediction Teaser
--------------------------------------------------------- */
export const getJudgeAnalyticsOverview = () => {
  return apiClient.get("/api/judge-analytics/overview/", {
    headers: { "Content-Type": "application/json" },
  });
};


/* ---------------------------------------------------------
   NEW: Get Judge Stats by ID
   Endpoint: /judges/{{judge_id}}/stats/
   Used for: Top cards on judge profile page
--------------------------------------------------------- */
export const getJudgeStats = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/stats/`, {
    headers: { "Content-Type": "application/json" },
  });
};


/* ---------------------------------------------------------
   NEW: Get Judge Case Distribution by Category
   Endpoint: /judges/{{judge_id}}/case_distribution/
   Response: { "Corporate Law": 0, "Civil Rights": 0, ... }
--------------------------------------------------------- */
export const getJudgeCaseDistribution = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/case_distribution/`, {
    headers: { "Content-Type": "application/json" },
  });
};


/* ---------------------------------------------------------
   NEW: Get Judge Insights
   Endpoint: /judges/{{judge_id}}/insights/
   Response: { "insights": [ { id, title, description, metric, enabled } ] }
--------------------------------------------------------- */
export const getJudgeInsights = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/insights/`, {
    headers: { "Content-Type": "application/json" },
  });
};


/* ---------------------------------------------------------
   NEW: Get Judge Old Analytics Data
   Endpoint: /judges/{{judge_id}}/analytics_old/
   Used for: Analytics tab (monthly stats, motion outcomes, etc.)
--------------------------------------------------------- */
export const getJudgeOldAnalytics = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/analytics_old/`, {
    headers: { "Content-Type": "application/json" },
  });
};






/*--------------------------------------------Judge  Pridiction apis__________________________________________
/* ---------------------------------------------------------
   NEW: Get Judge Prediction Context
   Endpoint: /judges/{{judge_id}}/prediction_context/
   Used for: Right sidebar cards on Predictions page (except Historical Performance)
--------------------------------------------------------- */
export const getJudgePredictionContext = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/prediction_context/`, {
    headers: { "Content-Type": "application/json" },
  });
};


/* ---------------------------------------------------------
   NEW: Get Judge Historical Performance by Case Type
   Endpoint: /judges/{{judge_id}}/historical_performance/
   Response: { judge_id, judge_name, performance_by_case_type: [...] }
--------------------------------------------------------- */
export const getJudgeHistoricalPerformance = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/historical_performance/`, {
    headers: { "Content-Type": "application/json" },
  });
};