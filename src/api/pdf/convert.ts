import { apiClient } from "../config";

export const convertPDFToImage = (file: File, outputFormat: string) => {
  if (!file) throw new Error("File required.");
  if (!outputFormat) throw new Error("Output format required (JPG or PNG).");
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("output_format", outputFormat.toUpperCase());
  return apiClient.post("/pdf/pdf_to_image/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const convertWordToPDF = (file: File) => {
  if (!file) throw new Error("Word file required.");
  const formData = new FormData();
  formData.append("input_files", file, file.name);
  return apiClient.post("/pdf/word_to_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });
};


export const convertPDFTOText = (file: File) => {
  if (!file) throw new Error("pdf file required.");
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  return apiClient.post("/pdf/extract_text/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });
};
