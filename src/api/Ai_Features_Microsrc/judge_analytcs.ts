import { apiClient } from "./ai_mics_config";


export const getJudgesList = () => {
  return apiClient.get("/api/judges/", {
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
