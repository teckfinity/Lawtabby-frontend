/**
 * api/ai-features/dashboard.ts
 * ──────────────────────────────
 * Dashboard API calls — both endpoints are auth-required.
 */
import { aiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  documents_processed: number;
  hours_saved:         number;
  cases_analyzed:      number;
  success_rate:        string;   // "47%"
  predictions_made:    number;
  judges_analyzed:     number;
}

export interface ActivityItem {
  id:        string | number;   // backend now uses "predict-7", "pdf-MergedPDF-3" etc.
  action:    string;
  file:      string;
  tool:      string;
  time:      string;
  timestamp: string;
  icon_type: "document" | "pdf" | "legal" | "prediction";
}

export interface RecentActivity {
  total:      number;
  activities: ActivityItem[];
}

// ─── API functions ────────────────────────────────────────────────────────────

export const getDashboardStats = () =>
  aiClient.get<{ success: boolean; data: DashboardStats }>("/api/dashboard/stats/");

export const getRecentActivity = () =>
  aiClient.get<{ success: boolean; data: RecentActivity }>("/api/dashboard/recent-activity/");
