/**
 * ai-features/doc-summary.ts
 * ────────────────────────────
 * Document Summarizer API calls.
 */
import { aiClient } from "./client";

export type OutputFormat = "irac" | "executive" | "detailed" | "bullet_points";
export type CitationStyle = "bluebook" | "apa" | "mla" | "chicago";
export type Language = "english" | "spanish" | "french" | "german";

export interface SummarizeOptions {
  action?: "process" | "save" | "reset";
  library_document_id?: number;
  output_format?: OutputFormat;
  summary_length?: number;
  confidence_threshold?: number;
  citation_style?: CitationStyle;
  language?: Language;
  auto_save?: boolean;
  key_facts?: boolean;
  legal_issues?: boolean;
  holdings_and_rulings?: boolean;
  recommendations?: boolean;
}

export const sendLegalDocSummary = (
  document?: File,
  text?: string,
  options: SummarizeOptions = {}
) => {
  const formData = new FormData();
  formData.append("action", options.action ?? "process");
  if (document) formData.append("document", document, document.name);
  if (text) formData.append("text", text);
  if (options.library_document_id != null) {
    formData.append("library_document_id", String(options.library_document_id));
  }
  formData.append("output_format", options.output_format ?? "irac");
  if (options.summary_length != null)
    formData.append("summary_length", String(options.summary_length));
  if (options.confidence_threshold != null)
    formData.append("confidence_threshold", String(options.confidence_threshold));
  formData.append("citation_style", options.citation_style ?? "bluebook");
  formData.append("language", options.language ?? "english");
  formData.append("auto_save", String(options.auto_save ?? true));
  formData.append("key_facts", String(options.key_facts ?? true));
  formData.append("legal_issues", String(options.legal_issues ?? true));
  formData.append("holdings_and_rulings", String(options.holdings_and_rulings ?? true));
  formData.append("recommendations", String(options.recommendations ?? false));

  return aiClient.post("/documents/process/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
