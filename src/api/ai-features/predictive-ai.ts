/**
 * ai-features/predictive-ai.ts
 * ──────────────────────────────
 * Predictive AI API calls (productive_ai Django app).
 */
import { aiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── API functions ────────────────────────────────────────────────────────────

export const getPlatformStats = () =>
  aiClient.get<{ success: boolean; data: PlatformStats }>("/api/predictive-ai/stats/");

export const getCaseTypeRates = () =>
  aiClient.get<{ success: boolean; data: CaseTypeRate[] }>("/api/predictive-ai/case-type-rates/");

export const runPrediction = (payload: PredictPayload) =>
  aiClient.post<{ success: boolean; data: PredictionResult }>("/api/predictive-ai/predict/", payload);

export const savePredictionDraft = (payload: SaveDraftPayload) =>
  aiClient.post<{ success: boolean; data: { id: number; created_at: string } }>(
    "/api/predictive-ai/drafts/",
    payload
  );

export const getPredictionDrafts = (limit = 20) =>
  aiClient.get<{ success: boolean; data: PredictionDraftSummary[] }>(
    "/api/predictive-ai/drafts/",
    { params: { limit } }
  );

export const getPredictionDraftDetail = (draftId: number) =>
  aiClient.get<{ success: boolean; data: PredictionDraftDetail }>(
    `/api/predictive-ai/drafts/${draftId}/`
  );

export const deletePredictionDraft = (draftId: number) =>
  aiClient.delete(`/api/predictive-ai/drafts/${draftId}/`);
