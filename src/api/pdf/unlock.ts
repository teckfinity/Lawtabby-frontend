import { apiClient } from "../config";

export const unlockPDF = (file: File, password: string) => {
  if (!file) throw new Error("File required.");
  if (!password) throw new Error("Password required.");
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("password", password);
  return apiClient.post("/pdf/unlock_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
