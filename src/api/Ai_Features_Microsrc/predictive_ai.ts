import { apiClient } from "./ai_mics_config";



export const sendCasePrediction = (payload: {
  case_type: string;
  jurisdiction: string;
  case_summary: string;
  key_facts: string;
}) => {
  return apiClient.post("/api/cases/predict/", payload, {
    headers: { "Content-Type": "application/json" },
  });
};