import { apiClient } from "./ai_mics_config";

export const sendLegalResearchAdvanced = (
  query: string,
  filters: {
    jurisdiction?: string;
    court_level?: string;
    date_from?: string;
    date_to?: string;
    judge_name?: string;
  } = {}
) => {
  if (!query) throw new Error("Query is required.");

  const payload = {
    query,
    filters,
  };

  return apiClient.post("/api/legal-research-advanced/", payload, {
    headers: { "Content-Type": "application/json" },
  });
};
