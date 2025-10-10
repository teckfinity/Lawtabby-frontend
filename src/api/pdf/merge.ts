import { apiClient } from "../config";

export const mergePDFs = (files: File[]) => {
  if (!files || files.length < 2) throw new Error("At least two PDF files are required.");
  const formData = new FormData();
  files.forEach((f) => formData.append("pdf_files", f, f.name));
  return apiClient.post("/pdf/merge_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
