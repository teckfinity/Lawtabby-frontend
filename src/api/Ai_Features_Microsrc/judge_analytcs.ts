// src/api/Ai_Features_Microsrc/judge_analytcs.ts

import { apiClient } from "./ai_mics_config";

/**
 * GET: List of Judges with pagination and search
 * Endpoint: /api/judges/
 * Query Params: limit, offset, search
 * Response: { results: [...], pagination: { limit, offset, total, has_next, has_previous } }
 */
export const getJudgesList = ({
  limit = 3,
  offset = 0,
  search,
}: {
  limit?: number;
  offset?: number;
  search?: string;
}) => {
  const params: Record<string, any> = {
    limit,
    offset,
  };

  if (search && search.trim().length > 0) {
    params.search = search.trim();
  }

  return apiClient.get("/api/judges/", {
    params,
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: cases/type-analysis/
--------------------------------------------------------- */
export const getCaseTypeAnalysis = () => {
  return apiClient.get("/api/cases/type-analysis/", {
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

// esky nechy tumhara nhi






























/* ---------------------------------------------------------
   GET: Judge Analytics Summary (top stats cards)
--------------------------------------------------------- */
export const getJudgeAnalyticsSummary = () => {
  return apiClient.get("/api/judge-analytics/summary/", {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Analytics Overview (right panel data)
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
--------------------------------------------------------- */
export const getJudgePredictionContext = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/prediction_context/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Judge Historical Performance
--------------------------------------------------------- */
export const getJudgeHistoricalPerformance = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/historical_performance/`, {
    headers: { "Content-Type": "application/json" },
  });
};









/* ---------------------------------------------------------
   GET: Judge Decision Patterns & Behavioral Analysis
--------------------------------------------------------- */
export const getJudgePatterns = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/patterns/`, {
    headers: { "Content-Type": "application/json" },
  });
};

















// /*--------------------------------------------Judge  Pridiction apis__________________________________________
// /* ---------------------------------------------------------
//    NEW: Get Judge Prediction Context
//    Endpoint: /judges/{{judge_id}}/prediction_context/
//    Used for: Right sidebar cards on Predictions page (except Historical Performance)
// --------------------------------------------------------- */
// export const getJudgePredictionContext = (judgeId: number) => {
//   if (!judgeId) throw new Error("Judge ID is required.");

//   return apiClient.get(`/api/judges/${judgeId}/prediction_context/`, {
//     headers: { "Content-Type": "application/json" },
//   });
// };


// /* ---------------------------------------------------------
//    NEW: Get Judge Historical Performance by Case Type
//    Endpoint: /judges/{{judge_id}}/historical_performance/
//    Response: { judge_id, judge_name, performance_by_case_type: [...] }
// --------------------------------------------------------- */
// export const getJudgeHistoricalPerformance = (judgeId: number) => {
//   if (!judgeId) throw new Error("Judge ID is required.");

//   return apiClient.get(`/api/judges/${judgeId}/historical_performance/`, {
//     headers: { "Content-Type": "application/json" },
//   });
// };



// /* ---------------------------------------------------------
//    NEW: POST Predict Outcome for a Judge
//    Endpoint: /judges/{{judge_id}}/predict_outcome/
//    Body: { case_type, client_position, case_description, key_facts }
// --------------------------------------------------------- */
// export const postJudgePredictOutcome = (
//   judgeId: number,
//   payload: {
//     case_type: string;
//     client_position: string;
//     case_description: string;
//     key_facts: string[];
//   }
// ) => {
//   if (!judgeId) throw new Error("Judge ID is required.");

//   return apiClient.post(`/api/judges/${judgeId}/predict_outcome/`, payload, {
//     headers: { "Content-Type": "application/json" },
//   });
// };

// /* ---------------------------------------------------------
//    NEW: Get Judge Case History with Filters & Pagination
//    Endpoint: /judges/{{judge_id}}/case_history/
//    Query Params: search, case_type, status, limit, page
// --------------------------------------------------------- */
// export const getJudgeCaseHistory = (
//   judgeId: number,
//   params: {
//     search?: string;
//     case_type?: string;
//     status?: string; // 'active' | 'closed'
//     limit?: number;
//     page?: number;
//   } = {}
// ) => {
//   if (!judgeId) throw new Error("Judge ID is required.");

//   return apiClient.get(`/api/judges/${judgeId}/case_history/`, {
//     params,
//     headers: { "Content-Type": "application/json" },
//   });
// };


// /* ---------------------------------------------------------
//    NEW: Get Judge Decision Patterns & Behavioral Analysis
//    Endpoint: /judges/{{judge_id}}/patterns/
// --------------------------------------------------------- */
// export const getJudgePatterns = (judgeId: number) => {
//   if (!judgeId) throw new Error("Judge ID is required.");

//   return apiClient.get(`/api/judges/${judgeId}/patterns/`, {
//     headers: { "Content-Type": "application/json" },
//   });
// };