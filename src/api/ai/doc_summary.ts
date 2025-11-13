import { apiClient } from "../config";

export const sendLegalChat = (
  action: "process" | "save" | "reset" = "process",
  document?: File,
  text?: string,
  output_format: "irac" | "executive" | "detailed" | "bullet_points" = "irac",
  summary_length?: number,
  confidence_threshold?: number,
  citation_style: "bluebook" | "apa" | "mla" | "chicago" = "bluebook",
  language: "english" | "spanish" | "french" | "german" = "english",
  auto_save: boolean = true,
  key_facts: boolean = true,
  legal_issues: boolean = true,
  holdings_and_rulings: boolean = true,
  recommendations: boolean = false
) => {
  const formData = new FormData();

  formData.append("action", action);
  if (document) formData.append("document", document, document.name);
  if (text) formData.append("text", text);
  formData.append("output_format", output_format);
  if (summary_length) formData.append("summary_length", summary_length.toString());
  if (confidence_threshold)
    formData.append("confidence_threshold", confidence_threshold.toString());
  formData.append("citation_style", citation_style);
  formData.append("language", language);
  formData.append("auto_save", auto_save.toString());
  formData.append("key_facts", key_facts.toString());
  formData.append("legal_issues", legal_issues.toString());
  formData.append("holdings_and_rulings", holdings_and_rulings.toString());
  formData.append("recommendations", recommendations.toString());

  return apiClient.post("/documents/process/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
