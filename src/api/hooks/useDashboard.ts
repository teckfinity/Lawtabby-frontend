/**
 * api/hooks/useDashboard.ts
 * ──────────────────────────
 * React Query hooks for the Dashboard page.
 *
 * Cache strategy:
 *   stats    → staleTime 5 min  (matches server cache TTL)
 *   activity → staleTime 30 s   (user expects near-real-time feed)
 *
 * Both hooks are only enabled when an auth token is present.
 */
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { getDashboardStats, getRecentActivity } from "@/api/ai-features/dashboard";

const isAuth = () => !!localStorage.getItem("authToken");

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn:  async () => (await getDashboardStats()).data.data,
    enabled:  isAuth(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(),
    queryFn:  async () => (await getRecentActivity()).data.data,
    enabled:  isAuth(),
    staleTime: 30 * 1000,
    retry: 1,
  });
}
