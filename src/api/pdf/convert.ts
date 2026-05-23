import axios from "axios";
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

  return await apiClient.post("/pdf/pdf_to_format/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

type FormatToPdfSuccess = {
  message?: string;
  error?: string;
  conversion_data?: {
    converted_pdf: string;
    /** `libreoffice` = layout preserved; `reportlab_fallback` = no LO or conversion failed */
    docx_conversion_engine?: string;
  };
};

/** Turn absolute download URLs from the API into a path for this axios client (same origin as VITE_API_URL). */
function toRelativeApiPath(downloadUrl: string): string {
  try {
    const u = new URL(downloadUrl);
    return u.pathname + u.search;
  } catch {
    return downloadUrl.startsWith("/") ? downloadUrl : `/${downloadUrl}`;
  }
}

async function parseBlobError(blob: Blob): Promise<string | null> {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text) as { error?: string; detail?: string };
    return parsed.error || parsed.detail || text.slice(0, 200);
  } catch {
    return null;
  }
}

/**
 * Backend POST /pdf/format_to_pdf/ returns JSON { conversion_data: { converted_pdf } }.
 * Actual bytes are fetched from GET /pdf/download_converted_pdf/<id>/.
 * Previously this used responseType: "blob" on POST — that saved JSON as bytes, yielding a bogus "PDF".
 */
export type ConvertWordToPdfResult = {
  blob: Blob;
  /** DOCX routes only — tells you whether LibreOffice layout conversion ran */
  docxConversionEngine?: string;
};

export async function convertWordToPDF(
  file: File
): Promise<ConvertWordToPdfResult> {
  if (!file) throw new Error("File required.");

  const formData = new FormData();
  formData.append("input_file", file, file.name);

  try {
    const postRes = await apiClient.post<FormatToPdfSuccess>(
      "/pdf/format_to_pdf/",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    const payload = postRes.data;
    if (payload?.error || !payload.conversion_data?.converted_pdf) {
      throw new Error(
        payload?.error ||
          "Conversion failed: server did not return a download URL."
      );
    }

    const docxConversionEngine =
      payload.conversion_data.docx_conversion_engine;

    const relativePath = toRelativeApiPath(
      payload.conversion_data.converted_pdf
    );

    const pdfRes = await apiClient.get(relativePath, {
      responseType: "blob",
    });

    const blob = pdfRes.data;
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error("Downloaded PDF is empty.");
    }

    const ct = pdfRes.headers["content-type"] || "";
    if (ct.includes("application/json")) {
      const msg = await parseBlobError(blob);
      throw new Error(msg || "Server returned an error instead of a PDF.");
    }

    return { blob, docxConversionEngine };
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const res = e.response;
      if (res?.data instanceof Blob) {
        const msg = await parseBlobError(res.data);
        if (msg) throw new Error(msg);
      }
      if (typeof res?.data === "object" && res.data !== null && "error" in res.data) {
        const err = (res.data as { error?: string }).error;
        if (err) throw new Error(err);
      }
    }
    throw e;
  }
}
