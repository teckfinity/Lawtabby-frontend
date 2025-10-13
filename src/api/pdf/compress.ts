import { apiClient } from "../config";

export const compressPDF = (file: File, quality: number) => {
  if (!file) throw new Error("A PDF is required.");
  if (quality < 0 || quality > 100) throw new Error("Quality 0–100 only.");
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("compression_quality", quality.toString());
  return apiClient.post("/pdf/compress_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
