import { apiClient } from "./ai_mics_config";

/* -----------------------------
   Request Types
--------------------------------*/
export interface CasePredictionPayload {
  case_type: string;
  jurisdiction: string;
  judge_id: number;
  brief_summary: string;
}

/* -----------------------------
   Response Types
--------------------------------*/
export interface PredictionFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
}

export interface CasePredictionResponse {
  case_id: number;
  case_name: string;
  predicted_outcome: string;
  success_probability: number;
  factors: PredictionFactor[];
  similar_cases: any[]; // you can strongly type later if needed
}

/* -----------------------------
   API Function
--------------------------------*/
export const sendCasePrediction = (
  payload: CasePredictionPayload
) => {
  if (!payload.case_type || !payload.jurisdiction || !payload.judge_id) {
    throw new Error("Missing required fields for case prediction.");
  }

  return apiClient.post<CasePredictionResponse>(
    "/api/agents/case-prediction/",
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
