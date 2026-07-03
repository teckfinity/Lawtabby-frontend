import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteLibraryDocument,
  downloadLibraryDocument,
  fetchLibraryDocuments,
  LibraryListParams,
  uploadLibraryDocument,
} from "../ai-features/document-library";

export function useLibraryDocuments(params: LibraryListParams) {
  return useQuery({
    queryKey: ["document-library", params],
    queryFn: () => fetchLibraryDocuments(params),
  });
}

export function useLibraryUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadLibraryDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-library"] });
      toast.success("Document uploaded to your library.");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (error?.response?.status === 402) {
        toast.error(data?.message || "Library limit reached. Upgrade your plan or delete a file.");
        return;
      }
      const message = data?.message || "Upload failed. Please try again.";
      toast.error(message);
    },
  });
}

export function useLibraryDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLibraryDocument,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-library"] });
      toast.success("Document removed.");
    },
    onError: () => toast.error("Could not delete document."),
  });
}

export async function handleLibraryDownload(id: number, filename: string) {
  try {
    await downloadLibraryDocument(id, filename);
  } catch {
    toast.error("Download failed.");
  }
}
