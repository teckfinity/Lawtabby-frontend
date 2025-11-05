import { apiClient, API_BASE_URL, getAuthToken } from "../config";

/**
 * Calls the OCR endpoint.
 * @param file      – the PDF (or image) file
 * @param language  – one of: "eng" | "spa" | "fra" | "deu"
 */
export const convertOCRToPDF = (file: File, language: string) => {
  if (!file) throw new Error("Image file required for OCR.");
  if (!language) throw new Error("Language is required.");

  const token = getAuthToken();
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("language", language);   // ← API expects this field

  return apiClient.post("/pdf/ocr_to_pdf/", formData, {
    headers: {
      // Let the browser set the correct boundary for multipart/form-data
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
  });
};

export const downloadOCRPDF = (fileName: string) => {
  if (!fileName) throw new Error("File name required.");
  const link = document.createElement("a");
  link.href = `${API_BASE_URL}/pdf/download/${fileName}/`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
