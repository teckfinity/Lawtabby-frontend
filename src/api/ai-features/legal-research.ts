/**
 * ai-features/legal-research.ts
 * ───────────────────────────────
 * Legal Research AI API calls.
 */
import { aiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LegalResearchFilters {
  jurisdiction?: string;
  court_level?: string;
  date_from?: string | null;
  date_to?: string | null;
  judge_name?: string | null;
}

export interface LegalResearchResponse {
  question: string;
  summary: string;
  key_authorities: string[];
  analysis: string;
  citations: string[];
}

// ─── API functions ────────────────────────────────────────────────────────────

export const sendLegalResearch = (question: string, filters: LegalResearchFilters = {}) => {
  if (!question) throw new Error("Question is required.");
  return aiClient.post<LegalResearchResponse>("/api/agents/legal-research/", {
    question,
    ...filters,
  });
};
