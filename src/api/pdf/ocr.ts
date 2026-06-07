import { apiClient } from "../config";

export type OcrLanguage = "eng" | "spa" | "fra" | "deu";

export type OcrLanguageOption = {
  code: OcrLanguage;
  label: string;
  installed: boolean;
};

export type OcrPageQuality = {
  page: number;
  confidence: number;
  quality: string;
  word_count: number;
  low_confidence: boolean;
  source?: string;
};

export type OcrQualityMetrics = {
  average_confidence: number;
  quality_label: string;
  pages_processed: number;
  pages: OcrPageQuality[];
  low_confidence_pages: number[];
  warnings: string[];
};

export type StructuredTextBlock = {
  type: "heading" | "paragraph" | "list" | string;
  text: string;
};

export type StructuredTextPage = {
  page: number;
  blocks: StructuredTextBlock[];
};

export type OcrProcessingMeta = {
  ocr_layer_status?: string;
  ocr_primary_engine?: string | null;
  processing_time_seconds?: number;
  total_pages_processed?: number;
  fallback_reason?: string | null;
  searchable_chars_preview_before?: number;
  searchable_chars_preview_after?: number;
  average_confidence?: number;
  quality_label?: string;
  ocr_quality?: OcrQualityMetrics;
  structured_text?: string;
  structured_pages?: StructuredTextPage[];
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
  structured_pages?: StructuredTextPage[];
  total_pages_processed?: number;
  ocr_processing?: OcrProcessingMeta;
  ocr_quality?: OcrQualityMetrics;
  error?: string;
};

/** Languages supported by OCR and whether each pack is installed on the server. */
export const fetchOcrLanguages = () =>
  apiClient.get<{ languages: OcrLanguageOption[] }>("/pdf/ocr_languages/");

/** Calls the OCR endpoint. */
export const convertOCRToPDF = (
  file: File,
  language: string,
  options?: { forceOcr?: boolean },
) => {
  if (!file) throw new Error("Image file required for OCR.");
  if (!language) throw new Error("Language is required.");

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("language", language);
  if (options?.forceOcr) {
    formData.append("force_ocr", "true");
  }

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

export function qualityBadgeClass(label: string): string {
  switch (label) {
    case "Excellent":
      return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
    case "Good":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
    case "Fair":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
    case "Poor":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
