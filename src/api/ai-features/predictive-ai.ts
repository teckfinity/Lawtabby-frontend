/**
 * ai-features/predictive-ai.ts
 * ──────────────────────────────
 * Predictive AI API calls (productive_ai Django app).
 */
import { aiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlatformStats {
  predictions_used: number;
  predictions_limit: number | null;
  predictions_remaining: number | null;
  predictions_made: number;
  case_analyses: number;
  staff_exempt: boolean;
  max_upload_mb: number;
  scope: "user" | "platform";
}

export interface ParsedCaseDocument {
  filename: string;
  case_summary: string;
  key_facts: string;
  characters_extracted: number;
  max_upload_mb?: number;
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

export interface PredictionFactor {
  name: string;
  weight_percent: number;
  score: number;
  contribution: number;
  detail?: string;
}

export interface PredictionResult {
  success_probability: number;
  historical_baseline_rate?: number;
  case_adjustment?: number;
  adjustment_reasons?: string[];
  prediction_factors?: PredictionFactor[];
  confidence_level: string;
  outcome_breakdown: OutcomeBreakdown;
  outcome_breakdown_basis?: string;
  contributing_factors: ContributingFactor[];
  ai_insights: string[];
  estimated_decision_time: string;
  decision_time_basis?: string;
  total_similar_cases: number;
  analysis_basis: string;
  case_analysis_basis?: string;
  recommendation_label: string;
  recommendation_action: string;
  risk_level: string;
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

export const parseCaseDocument = (document: File) => {
  const formData = new FormData();
  formData.append("document", document, document.name);
  return aiClient.post<{ success: boolean; data: ParsedCaseDocument }>(
    "/api/predictive-ai/parse-document/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
};

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
