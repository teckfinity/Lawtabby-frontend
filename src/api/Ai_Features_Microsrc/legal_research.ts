import { apiClient } from "./ai_mics_config";

export const sendLegalResearchAdvanced = (
  question: string,
  filters: {
    jurisdiction?: string;
    court_level?: string;
    date_from?: string;
    date_to?: string;
    judge_name?: string;
  } = {}
) => {
  if (!question) throw new Error("Question is required.");

  const payload = {
    question,
    ...filters,
  };

  return apiClient.post("/api/agents/legal-research/", payload, {
    headers: { "Content-Type": "application/json" },
  });
};
