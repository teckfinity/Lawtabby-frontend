import { apiClient } from "../config";

export const splitPDF = (file: File, startPage: number, endPage: number) => {
  if (!file) throw new Error("A PDF file is required.");
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  // formData.append("start_page", startPage.toString());
  // formData.append("end_page", endPage.toString());
  return apiClient.post("/pdf/split_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
