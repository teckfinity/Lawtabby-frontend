import { apiClient, getAuthToken } from "../config";

export type OcrLanguage = "eng" | "spa" | "fra" | "deu";

export type OcrLanguageOption = {
  code: OcrLanguage;
  label: string;
  installed: boolean;
};

export type OcrApiResponse = {
  message?: string;
  data?: {
    id?: number;
    pdf?: string;
    language?: string;
  };
  extracted_text?: string;
  extracted_text_preview?: string;
  total_pages_processed?: number;
  ocr_processing?: {
    ocr_layer_status?: string;
    ocr_primary_engine?: string | null;
    processing_time_seconds?: number;
  };
  error?: string;
};

/** Languages supported by OCR and whether each pack is installed on the server. */
export const fetchOcrLanguages = () =>
  apiClient.get<{ languages: OcrLanguageOption[] }>("/pdf/ocr_languages/");

/**
 * Calls the OCR endpoint.
 */
export const convertOCRToPDF = (file: File, language: string) => {
  if (!file) throw new Error("Image file required for OCR.");
  if (!language) throw new Error("Language is required.");

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("language", language);

  return apiClient.post<OcrApiResponse>("/pdf/ocr_to_pdf/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 600_000,
  });
};

/** Resolve API download URL to a path for authenticated axios fetch. */
export function ocrDownloadPath(pdfUrl: string): string {
  try {
    const u = new URL(pdfUrl);
    return u.pathname + u.search;
  } catch {
    return pdfUrl.startsWith("/") ? pdfUrl : `/${pdfUrl}`;
  }
}

/** Fetch OCR PDF bytes with auth (for preview + download). */
export async function fetchOcrPdfBlob(pdfUrl: string): Promise<Blob> {
  const path = ocrDownloadPath(pdfUrl);
  const res = await apiClient.get(path, { responseType: "blob" });
  const blob = res.data;
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("Downloaded OCR PDF is empty.");
  }
  const ct = res.headers["content-type"] || "";
  if (ct.includes("application/json")) {
    throw new Error("Server returned an error instead of a PDF.");
  }
  return blob;
}
