/**
 * api/hooks/keys.ts
 * ──────────────────
 * Centralised React Query key factory for the entire application.
 * Changing a key here propagates everywhere automatically.
 *
 * Convention:
 *   keys.domain.resource(params)
 */

export const queryKeys = {
  // ── Judge Analytics ──────────────────────────────────────────────────────
  judges: {
    all:          ()                       => ["judges"] as const,
      list:         (p: { limit: number; offset: number; search?: string }) => ["judges", "list", p] as const,
    profile:      (id: number)             => ["judges", "profile", id] as const,
    caseHistory:  (id: number, p?: object) => ["judges", "case-history", id, p] as const,
    prediction:   (id: number)             => ["judges", "prediction", id] as const,
    historical:   (id: number)             => ["judges", "historical", id] as const,
    distribution: (id: number)             => ["judges", "distribution", id] as const,
    patterns:     (id: number)             => ["judges", "patterns", id] as const,
    summary:      ()                       => ["judges", "summary"] as const,
    overview:     ()                       => ["judges", "overview"] as const,
    caseTypes:    ()                       => ["judges", "case-types"] as const,
    insights:     ()                       => ["judges", "insights"] as const,
  },

  // ── Legal Research ────────────────────────────────────────────────────────
  legalResearch: {
    all:  () => ["legal-research"] as const,
  },

  // ── Predictive AI ─────────────────────────────────────────────────────────
  predictiveAI: {
    all:       ()                => ["predictive-ai"] as const,
    stats:     ()                => ["predictive-ai", "stats"] as const,
    caseRates: ()                => ["predictive-ai", "case-rates"] as const,
    drafts:    ()                => ["predictive-ai", "drafts"] as const,
    draft:     (id: number)      => ["predictive-ai", "drafts", id] as const,
  },

  // ── Document Summarizer ───────────────────────────────────────────────────
  docSummary: {
    all: () => ["doc-summary"] as const,
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    stats:    () => ["dashboard", "stats"]    as const,
    activity: () => ["dashboard", "activity"] as const,
  },
} as const;
