import { apiClient } from "./ai_mics_config";


export const getJudgesList = ({
  page = 1,
  limit = 3,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const params: Record<string, any> = {
    page,
    limit,
  };

  //  Only add search if it has value
  if (search && search.trim().length > 0) {
    params.search = search.trim();
  }

  return apiClient.get("/api/judges/", {
    params,
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   GET: Fetch Complete Judge Profile by ID
--------------------------------------------------------- */
export const getJudgeCompleteProfile = (judgeId: number) => {
  if (!judgeId) throw new Error("Judge ID is required.");

  return apiClient.get(`/api/judges/${judgeId}/complete_profile/`, {
    headers: { "Content-Type": "application/json" },
  });
};

/* ---------------------------------------------------------
   NEW: Get Judge Analytics Summary (for top cards)
--------------------------------------------------------- */
export const getJudgeAnalyticsSummary = () => {
  return apiClient.get("/api/judge-analytics/summary/", {
    headers: { "Content-Type": "application/json" },
  });
};