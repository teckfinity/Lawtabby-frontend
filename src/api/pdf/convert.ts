import { apiClient } from "../config";

export const convertPDF = async (file: File, outputFormat: string) => {
  if (!file) throw new Error("PDF file is required.");
  if (!outputFormat)
    throw new Error(
      "Output format is required (word, excel, powerpoint, jpeg, png, text)."
    );

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("output_format", outputFormat.toLowerCase());

  // ✅ Always return full response (not just .data)
  return await apiClient.post("/pdf/pdf_to_format/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};