/**
 * document-automation.ts — Document Automation API
 */
import { aiClient } from "./client";

export interface AutomationOutputType {
  key: string;
  label: string;
}

export interface AutomationTemplate {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  is_bundle: boolean;
  output_types: AutomationOutputType[];
  required_fields: string[];
  icon_key: string;
  color_key: string;
  use_count: number;
  use_rag: boolean;
}

export interface AutomationDocument {
  id: number;
  job_id: number;
  doc_type: string;
  title: string;
  content?: string;
  word_count: number;
  status: string;
  library_document_id: number | null;
  template_name: string;
  template_category: string;
  created_at: string;
  date_display: string;
  relative_time?: string;
  size_display: string;
}

export interface AutomationJob {
  id: number;
  template_name: string;
  status: string;
  generation_ms: number;
  tokens_used: number | null;
  model: string;
  rag_used: boolean;
  rag_sources: Array<{ title: string; court: string; date?: string; year?: string; url: string }>;
  created_at: string;
  documents: AutomationDocument[];
  usage?: { used: number; limit: number | null; feature_key: string };
}

export interface AutomationStats {
  documents_generated: number;
  time_saved_hours: number;
  templates_available: number;
  usage: { used: number; limit: number | null; feature_key: string };
}

export interface AutomationSettings {
  auto_save_to_library: boolean;
  default_tone: "formal" | "assertive" | "neutral";
  jurisdiction: string;
  include_disclaimer: boolean;
}

export interface GenerateAutomationPayload {
  template_slug: string;
  input: Record<string, string>;
  library_document_ids?: number[];
}

export async function fetchAutomationTemplates() {
  const { data } = await aiClient.get<{ success: boolean; data: AutomationTemplate[] }>(
    "/api/document-automation/templates/"
  );
  return data.data;
}

export async function fetchAutomationStats() {
  const { data } = await aiClient.get<{ success: boolean; data: AutomationStats }>(
    "/api/document-automation/stats/"
  );
  return data.data;
}

export async function fetchAutomationDocuments(q?: string) {
  const { data } = await aiClient.get<{
    success: boolean;
    data: { count: number; results: AutomationDocument[] };
  }>("/api/document-automation/documents/", { params: q ? { q } : undefined });
  return data.data;
}

export async function fetchAutomationDocument(id: number) {
  const { data } = await aiClient.get<{ success: boolean; data: AutomationDocument }>(
    `/api/document-automation/documents/${id}/`
  );
  return data.data;
}

export async function generateAutomationDocument(payload: GenerateAutomationPayload) {
  const { data } = await aiClient.post<{ success: boolean; data: AutomationJob }>(
    "/api/document-automation/generate/",
    payload
  );
  return data.data;
}

export async function updateAutomationDocument(id: number, content: string, title?: string) {
  const { data } = await aiClient.patch<{ success: boolean; data: AutomationDocument }>(
    `/api/document-automation/documents/${id}/`,
    { content, title }
  );
  return data.data;
}

export async function deleteAutomationDocument(id: number) {
  const { data } = await aiClient.delete<{ success: boolean; data: { message: string } }>(
    `/api/document-automation/documents/${id}/`
  );
  return data.data;
}

export async function downloadAutomationDocument(
  id: number,
  format: "txt" | "pdf" = "txt",
  suggestedName?: string
) {
  const response = await aiClient.get(`/api/document-automation/documents/${id}/download/`, {
    params: { file_format: format },
    responseType: "blob",
  });

  const contentType = String(response.headers["content-type"] || "");
  if (contentType.includes("application/json")) {
    const text = await (response.data as Blob).text();
    let message = "Download failed.";
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const ext = format === "pdf" ? "pdf" : "txt";
  const disposition = response.headers["content-disposition"] as string | undefined;
  const match = disposition?.match(/filename="?([^";\n]+)"?/i);
  const filename = suggestedName || match?.[1] || `document-${id}.${ext}`;

  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function fetchAutomationSettings() {
  const { data } = await aiClient.get<{ success: boolean; data: AutomationSettings }>(
    "/api/document-automation/settings/"
  );
  return data.data;
}

export async function updateAutomationSettings(settings: Partial<AutomationSettings>) {
  const { data } = await aiClient.put<{ success: boolean; data: AutomationSettings }>(
    "/api/document-automation/settings/",
    settings
  );
  return data.data;
}
