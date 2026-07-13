import { apiClient } from "../config";

/** Tier names match backend: extreme (high), recommended (medium), less (low). */
export type CompressionTier = "extreme" | "recommended" | "less";

export const compressPDF = (file: File, tier: CompressionTier) => {
  if (!file) throw new Error("A PDF is required.");

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("compression_quality", tier);

  return apiClient.post("/pdf/compress_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
