/**
 * api/hooks/useCitationMaps.ts
 * ─────────────────────────────
 * React Query hooks for the Citation Maps feature.
 *
 * Caching strategy:
 *   - stats / filters / influential : staleTime 5 min (server caches 5 min too)
 *   - network                        : staleTime 2 min (per query+filters)
 *   - suggestions / case search      : staleTime 1 min, debounced by caller
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "./keys";
import {
  createSavedCitationMap,
  deleteSavedCitationMap,
  getCitationCases,
  getCitationFilterOptions,
  getCitationMapStats,
  getCitationNetwork,
  getCitationSearchSuggestions,
  getInfluentialCases,
  getSavedCitationMaps,
  type CitationNetworkParams,
} from "@/api/ai-features/citation-maps";

const STALE_5MIN = 5 * 60 * 1000;
const STALE_2MIN = 2 * 60 * 1000;
const STALE_1MIN = 60 * 1000;

export function useCitationMapStats() {
  return useQuery({
    queryKey: queryKeys.citationMaps.stats(),
    queryFn: async () => (await getCitationMapStats()).data,
    staleTime: STALE_5MIN,
  });
}

export function useCitationFilterOptions() {
  return useQuery({
    queryKey: queryKeys.citationMaps.filters(),
    queryFn: async () => (await getCitationFilterOptions()).data,
    staleTime: STALE_5MIN,
  });
}

export function useCitationSearchSuggestions(query: string) {
  return useQuery({
    queryKey: queryKeys.citationMaps.suggestions(query),
    queryFn: async () => (await getCitationSearchSuggestions(query)).data.results,
    enabled: query.trim().length >= 2,
    staleTime: STALE_1MIN,
    placeholderData: (prev) => prev,
  });
}

export function useCitationCaseSearch(query: string, limit = 10) {
  return useQuery({
    queryKey: queryKeys.citationMaps.cases(query),
    queryFn: async () => (await getCitationCases(query, limit)).data.results,
    staleTime: STALE_1MIN,
    placeholderData: (prev) => prev,
  });
}

export function useInfluentialCases(limit = 5) {
  return useQuery({
    queryKey: queryKeys.citationMaps.influential(limit),
    queryFn: async () => (await getInfluentialCases(limit)).data.results,
    staleTime: STALE_5MIN,
  });
}

export function useCitationNetwork(params: CitationNetworkParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.citationMaps.network(params),
    queryFn: async () => (await getCitationNetwork(params)).data,
    enabled,
    staleTime: STALE_2MIN,
    placeholderData: (prev) => prev,
  });
}

export function useSavedCitationMaps() {
  return useQuery({
    queryKey: queryKeys.citationMaps.savedMaps(),
    queryFn: async () => (await getSavedCitationMaps()).data.results,
    staleTime: STALE_2MIN,
  });
}

export function useSaveCitationMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof createSavedCitationMap>[0]) =>
      createSavedCitationMap(payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.citationMaps.savedMaps() });
      toast("Citation map saved to your library!");
    },
    onError: () => {
      toast.error("Failed to save citation map. Please try again.");
    },
  });
}

export function useDeleteCitationMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSavedCitationMap(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.citationMaps.savedMaps() });
    },
  });
}
