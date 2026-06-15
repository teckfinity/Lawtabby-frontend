export type ChatCaseAuthority = {
  title?: string;
  court?: string;
  date?: string;
  citation?: string;
  url?: string;
  influence_score?: number;
  excerpt?: string;
  source_type?: string;
};

export type ChatJudgeInsight = {
  name?: string;
  grant_rate?: number;
  avg_decision_days?: number;
  practice_areas?: string[];
  court?: string;
  cases_handled?: number;
};

export type ChatPredictionData = {
  win_probability?: number;
  factors_increasing?: string[];
  risk_factors?: string[];
};

export type ChatStructuredResponse = {
  answer?: string;
  confidence?: number;
  authorities_reviewed?: number;
  cases?: ChatCaseAuthority[];
  citations?: string[];
  authorities?: string[];
  judge_insights?: ChatJudgeInsight[];
  prediction_data?: ChatPredictionData;
  related_cases?: string[];
  intent?: string;
  rag_used?: boolean;
};

export type ConversationMemory = {
  jurisdiction?: string;
  practice_area?: string;
  case_type?: string;
  judge?: string;
  claims?: string[];
  defenses?: string[];
  facts?: string[];
  parties?: string[];
  summary?: string;
};
