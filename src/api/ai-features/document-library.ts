/**
 * document-library.ts — Unified Document Library API
 */
import { aiClient } from "./client";

export type LibraryCategory = "uploaded" | "generated";

export interface LibraryDocument {
  id: number;
  category: LibraryCategory;
  source: string;
  source_label: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  size_display: string;
  created_at: string;
  date_display: string;
}

export interface LibraryUsage {
  uploaded: { used: number; limit: number | null };
  generated: { used: number; limit: number | null };
  storage: { used_bytes: number; limit_bytes: number | null };
}

export interface LibraryListParams {
  category?: LibraryCategory;
  q?: string;
  file_type?: string;
  date_from?: string;
  date_to?: string;
}

export async function fetchLibraryDocuments(params: LibraryListParams = {}) {
  const { data } = await aiClient.get<{
    success: boolean;
    count: number;
    results: LibraryDocument[];
    usage?: LibraryUsage;
  }>("/api/document-library/", { params });
  return data;
}

export async function fetchLibraryLimits() {
  const { data } = await aiClient.get<{ success: boolean; usage: LibraryUsage }>(
    "/api/document-library/limits/"
  );
  return data.usage;
}

export async function uploadLibraryDocument(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await aiClient.post<{
    success: boolean;
    document: LibraryDocument;
  }>("/api/document-library/upload/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function downloadLibraryDocument(id: number, filename: string) {
  const response = await aiClient.get(`/api/document-library/${id}/download/`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function libraryDocumentToFile(id: number, filename: string): Promise<File> {
  const response = await aiClient.get(`/api/document-library/${id}/download/`, {
    responseType: "blob",
  });
  const type =
    (response.headers["content-type"] as string | undefined) || "application/octet-stream";
  return new File([response.data], filename, { type, lastModified: Date.now() });
}

export async function deleteLibraryDocument(id: number) {
  const { data } = await aiClient.delete<{ success: boolean; message: string }>(
    `/api/document-library/${id}/`
  );
  return data;
}
