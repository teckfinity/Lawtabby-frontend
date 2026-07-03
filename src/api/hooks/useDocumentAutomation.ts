import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  deleteAutomationDocument,
  downloadAutomationDocument,
  fetchAutomationDocument,
  fetchAutomationDocuments,
  fetchAutomationSettings,
  fetchAutomationStats,
  fetchAutomationTemplates,
  generateAutomationDocument,
  GenerateAutomationPayload,
  updateAutomationDocument,
  updateAutomationSettings,
} from "../ai-features/document-automation";

export function useAutomationTemplates() {
  return useQuery({
    queryKey: ["document-automation", "templates"],
    queryFn: fetchAutomationTemplates,
  });
}

export function useAutomationStats() {
  return useQuery({
    queryKey: ["document-automation", "stats"],
    queryFn: fetchAutomationStats,
  });
}

export function useAutomationDocuments(search?: string) {
  return useQuery({
    queryKey: ["document-automation", "documents", search ?? ""],
    queryFn: () => fetchAutomationDocuments(search),
  });
}

export function useAutomationDocument(id: number | null) {
  return useQuery({
    queryKey: ["document-automation", "document", id],
    queryFn: () => fetchAutomationDocument(id!),
    enabled: id != null,
  });
}

export function useAutomationSettings() {
  return useQuery({
    queryKey: ["document-automation", "settings"],
    queryFn: fetchAutomationSettings,
  });
}

export function useAutomationGenerate() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: GenerateAutomationPayload) => generateAutomationDocument(payload),
    onSuccess: (job) => {
      qc.invalidateQueries({ queryKey: ["document-automation"] });
      toast.success(
        job.documents.length > 1
          ? `${job.documents.length} documents generated successfully.`
          : "Document generated successfully."
      );
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (error?.response?.status === 402) {
        toast.error(data?.message || "Upgrade your plan to use Document Automation.");
        navigate("/subscription");
        return;
      }
      toast.error(data?.message || "Generation failed. Please try again.");
    },
  });
}

export function useAutomationUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, title }: { id: number; content: string; title?: string }) =>
      updateAutomationDocument(id, content, title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-automation"] });
      toast.success("Document updated.");
    },
    onError: () => toast.error("Could not save changes."),
  });
}

export function useAutomationDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAutomationDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-automation"] });
      toast.success("Document removed.");
    },
    onError: () => toast.error("Could not delete document."),
  });
}

export function useAutomationSettingsUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAutomationSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-automation", "settings"] });
      toast.success("Settings saved.");
    },
    onError: () => toast.error("Could not save settings."),
  });
}

export async function handleAutomationDownload(
  id: number,
  format: "txt" | "pdf" = "txt",
  suggestedName?: string
) {
  try {
    await downloadAutomationDocument(id, format, suggestedName);
    toast.success(format === "pdf" ? "PDF downloaded." : "Document downloaded.");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Download failed.";
    toast.error(message);
  }
}
