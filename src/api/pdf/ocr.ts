import { apiClient, API_BASE_URL, getAuthToken } from "../config";

export const convertOCRToPDF = (file: File) => {
  if (!file) throw new Error("Image file required for OCR.");
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  return apiClient.post("/pdf/ocr_to_pdf/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
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
