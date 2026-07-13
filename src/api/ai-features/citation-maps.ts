/**
 * ai-features/citation-maps.ts
 * ─────────────────────────────
 * All Citation Maps API calls.
 */
import { aiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CitationMapStats {
  cases_mapped: number;
  citation_links: number;
  avg_influence_score: number;
  last_updated: string | null;
  citation_links_source?: "edges" | "cluster_citation_count";
  citation_coverage?: number;
}

export interface CitationCaseNode {
  id: string;
  opinion_id: number;
  title: string;
  year: string;
  citations: number;
  influence: number;
  category: string;
  court: string;
  description: string;
  judges: string[];
  outcome: string;
  keyLegalPrinciples: string[];
  impactScore: number;
  relatedAreas: string[];
}

export interface CitationLink {
  source: string;
  target: string;
  strength: number;
}

export interface CitationNetworkResponse {
  nodes: CitationCaseNode[];
  links: CitationLink[];
  center_id: string | null;
  depth: number;
  total_nodes: number;
  total_links: number;
  max_depth_allowed?: number;
}

export interface CitationSearchSuggestion {
  title: string;
  type: "case" | "topic" | "judge" | "principle";
  description: string;
  opinion_id: number | null;
  keywords: string[];
}

export interface CitationFilterOptions {
  courts: Array<{ id: string; name: string; full_name: string }>;
  categories: string[];
  year_min: number;
  year_max: number;
}

export interface CitationNetworkFilters {
  courts?: string[];
  categories?: string[];
  year_from?: number;
  year_to?: number;
  min_citations?: number;
  min_influence?: number;
}

export interface CitationNetworkParams extends CitationNetworkFilters {
  q?: string;
  opinion_id?: number;
  opinion_ids?: number[];
  depth?: number;
}

export interface SavedCitationMap {
  id: number;
  title: string;
  search_query: string;
  opinion_ids: number[];
  filters: Record<string, unknown>;
  node_count: number;
  edge_count: number;
  created_at: string;
}

// ─── API functions ────────────────────────────────────────────────────────────

const filtersToParams = (p: CitationNetworkParams) => {
  const params: Record<string, string | number> = {};
  if (p.q?.trim()) params.q = p.q.trim();
  if (p.opinion_id) params.opinion_id = p.opinion_id;
  if (p.opinion_ids?.length) params.opinion_ids = p.opinion_ids.join(",");
  if (p.depth) params.depth = p.depth;
  if (p.courts?.length) params.courts = p.courts.join(",");
  if (p.categories?.length) params.categories = p.categories.join(",");
  if (p.year_from) params.year_from = p.year_from;
  if (p.year_to) params.year_to = p.year_to;
  if (p.min_citations) params.min_citations = p.min_citations;
  if (p.min_influence) params.min_influence = p.min_influence;
  return params;
};

export const getCitationMapStats = () =>
  aiClient.get<CitationMapStats>("/api/citation-maps/stats/");

export const getCitationFilterOptions = () =>
  aiClient.get<CitationFilterOptions>("/api/citation-maps/filters/");

export const getCitationSearchSuggestions = (q: string, limit = 8) =>
  aiClient.get<{ results: CitationSearchSuggestion[] }>(
    "/api/citation-maps/search/",
    { params: { q, limit } }
  );

export const getCitationCases = (q: string, limit = 10) =>
  aiClient.get<{ results: CitationCaseNode[] }>("/api/citation-maps/cases/", {
    params: { q, limit },
  });

export const getInfluentialCases = (limit = 5) =>
  aiClient.get<{ results: CitationCaseNode[] }>(
    "/api/citation-maps/influential/",
    { params: { limit } }
  );

export const getCitationNetwork = (params: CitationNetworkParams) =>
  aiClient.get<CitationNetworkResponse>("/api/citation-maps/network/", {
    params: filtersToParams(params),
  });

export const getSavedCitationMaps = () =>
  aiClient.get<{ results: SavedCitationMap[] }>("/api/citation-maps/maps/");

export const createSavedCitationMap = (payload: {
  title: string;
  search_query?: string;
  opinion_ids?: number[];
  filters?: Record<string, unknown>;
  node_count?: number;
  edge_count?: number;
}) => aiClient.post<SavedCitationMap>("/api/citation-maps/maps/", payload);

export const deleteSavedCitationMap = (id: number) =>
  aiClient.delete(`/api/citation-maps/maps/${id}/`);
