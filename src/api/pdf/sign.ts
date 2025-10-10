import { apiClient } from "../config";

export const signPDF = (
  file: File,
  signatures: { text: string; page: number; x: number; y: number }[]
) => {
  if (!file) throw new Error("File required.");
  if (!signatures.length) throw new Error("At least one signature required.");
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("signatures", JSON.stringify(signatures));
  return apiClient.post("/pdf/sign_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
