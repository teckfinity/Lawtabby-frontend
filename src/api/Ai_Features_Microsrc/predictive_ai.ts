/**
 * predictive_ai.ts
 * ─────────────────
 * Centralised API service for the Predictive AI feature.
 * All calls go through the shared `apiClient` (token auto-attached).
 *
 * Endpoints backed by productive_ai Django app:
 *   GET  /api/predictive-ai/stats/
 *   GET  /api/predictive-ai/case-type-rates/
 *   POST /api/predictive-ai/predict/
 *   POST /api/predictive-ai/drafts/         (save draft – auth)
 *   GET  /api/predictive-ai/drafts/         (list drafts – auth)
 *   GET  /api/predictive-ai/drafts/:id/     (draft detail – auth)
 *   DEL  /api/predictive-ai/drafts/:id/     (delete draft – auth)
 */

import { apiClient } from "./ai_mics_config";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlatformStats {
  predictions_made: number;
  accuracy_rate: number;
  cases_analyzed: number;
  success_improved: string;
}

export interface CaseTypeRate {
  case_type: string;
  success_rate: number;
  total_cases: number;
}

export interface ContributingFactor {
  name: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  detail?: string;
}

export interface OutcomeBreakdown {
  favorable: number;
  uncertain: number;
  unfavorable: number;
}

export interface PredictionResult {
  success_probability: number;
  confidence_level: string;
  outcome_breakdown: OutcomeBreakdown;
  contributing_factors: ContributingFactor[];
  ai_insights: string[];
  estimated_decision_time: string;
  total_similar_cases: number;
}

export interface PredictionDraftSummary {
  id: number;
  case_type: string;
  jurisdiction: string;
  success_probability: number | null;
  confidence_level: string;
  created_at: string;
}

export interface PredictionDraftDetail extends PredictionDraftSummary {
  case_summary: string;
  key_facts: string;
  result_json: Record<string, unknown>;
  updated_at: string;
}

export interface PredictPayload {
  case_type?: string;
  jurisdiction?: string;
  case_summary?: string;
  key_facts?: string;
  analysis_mode?: "quick" | "detailed";
}

export interface SaveDraftPayload extends PredictPayload {
  success_probability?: number;
  confidence_level?: string;
  result_json?: Record<string, unknown>;
}

// ─── API wrappers ─────────────────────────────────────────────────────────────

/** Header-card statistics (cached server-side, no auth) */
export const getPlatformStats = () =>
  apiClient.get<{ success: boolean; data: PlatformStats }>(
    "/api/predictive-ai/stats/"
  );

/** "Success Rates by Type" sidebar (cached, no auth) */
export const getCaseTypeRates = () =>
  apiClient.get<{ success: boolean; data: CaseTypeRate[] }>(
    "/api/predictive-ai/case-type-rates/"
  );

/** Run prediction – no auth, result not auto-saved */
export const runPrediction = (payload: PredictPayload) =>
  apiClient.post<{ success: boolean; data: PredictionResult }>(
    "/api/predictive-ai/predict/",
    payload
  );

/** Save a prediction draft (auth required) */
export const savePredictionDraft = (payload: SaveDraftPayload) =>
  apiClient.post<{ success: boolean; data: { id: number; created_at: string } }>(
    "/api/predictive-ai/drafts/",
    payload
  );

/** List current user's saved predictions (auth required) */
export const getPredictionDrafts = (limit = 20) =>
  apiClient.get<{ success: boolean; data: PredictionDraftSummary[] }>(
    "/api/predictive-ai/drafts/",
    { params: { limit } }
  );

/** Single draft detail (auth required) */
export const getPredictionDraftDetail = (draftId: number) =>
  apiClient.get<{ success: boolean; data: PredictionDraftDetail }>(
    `/api/predictive-ai/drafts/${draftId}/`
  );

/** Delete a draft (auth required) */
export const deletePredictionDraft = (draftId: number) =>
  apiClient.delete(`/api/predictive-ai/drafts/${draftId}/`);

// ─── Legacy export kept for backward-compat (used in old code) ───────────────
/** @deprecated Use runPrediction() instead */
export const sendCasePrediction = (payload: {
  case_type: string;
  jurisdiction: string;
  case_summary: string;
  key_facts: string;
}) => apiClient.post("/api/cases/predict/", payload);
