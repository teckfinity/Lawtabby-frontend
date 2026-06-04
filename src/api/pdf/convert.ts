import axios from "axios";
import { apiClient } from "../config";

/** Office/LibreOffice conversions can take several minutes on Cloud Run. */
const CONVERSION_POST_TIMEOUT_MS = 300_000;

function formatConversionNetworkError(err: unknown): Error | null {
  if (!axios.isAxiosError(err)) return null;
  if (err.code !== "ERR_NETWORK" && err.message !== "Network Error") return null;
  return new Error(
    "Conversion request failed before the server finished (timeout or server crash). " +
      "This often appears as a CORS error in the browser. " +
      "On Cloud Run: set request timeout ≥ 300s, memory ≥ 2Gi, and redeploy the API image with LibreOffice (calc/impress)."
  );
}

export const convertPDF = async (file: File, outputFormat: string) => {
  if (!file) throw new Error("PDF file is required.");
  if (!outputFormat)
    throw new Error(
      "Output format is required (word, excel, powerpoint, jpeg, png, text)."
    );

  const formData = new FormData();
  formData.append("input_pdf", file, file.name);
  formData.append("output_format", outputFormat.toLowerCase());

  try {
    return await apiClient.post("/pdf/pdf_to_format/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: CONVERSION_POST_TIMEOUT_MS,
    });
  } catch (e) {
    const net = formatConversionNetworkError(e);
    if (net) throw net;
    throw e;
  }
};

type FormatToPdfSuccess = {
  message?: string;
  error?: string;
  conversion_data?: {
    converted_pdf: string;
    docx_conversion_engine?: string;
    conversion_engine?: string;
    conversion_warning?: string;
  };
};

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

export type ConvertWordToPdfResult = {
  blob: Blob;
  docxConversionEngine?: string;
  conversionEngine?: string;
  conversionWarning?: string;
};

export const IMAGE_TO_PDF_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
]);

export function isImageToPdfFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_TO_PDF_EXTENSIONS.has(ext);
}

export type ConvertImagesToPdfResult = {
  mode: "combined" | "separate";
  blobs: { name: string; blob: Blob }[];
};

type ImagesToPdfSuccess = {
  message?: string;
  error?: string;
  mode?: "combined" | "separate";
  conversion_data?: {
    converted_pdf?: string;
    pdfs?: Array<{
      converted_pdf: string;
      original_name: string;
      filename: string;
    }>;
  };
};

async function downloadPdfBlob(relativePath: string): Promise<Blob> {
  const pdfRes = await apiClient.get(relativePath, { responseType: "blob" });
  const blob = pdfRes.data;
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error("Downloaded PDF is empty.");
  }
  const ct = pdfRes.headers["content-type"] || "";
  if (ct.includes("application/json")) {
    const msg = await parseBlobError(blob);
    throw new Error(msg || "Server returned an error instead of a PDF.");
  }
  return blob;
}

export async function convertImagesToPDF(
  files: File[],
  combine: boolean
): Promise<ConvertImagesToPdfResult> {
  if (!files.length) throw new Error("At least one image is required.");

  const formData = new FormData();
  files.forEach((file) => formData.append("input_files", file, file.name));
  formData.append("combine", combine ? "true" : "false");

  try {
    const postRes = await apiClient.post<ImagesToPdfSuccess>(
      "/pdf/images_to_pdf/",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: CONVERSION_POST_TIMEOUT_MS,
      }
    );

    const payload = postRes.data;
    if (payload?.error) {
      throw new Error(payload.error);
    }

    const mode = payload.mode ?? (combine ? "combined" : "separate");
    const blobs: { name: string; blob: Blob }[] = [];

    if (mode === "combined" && payload.conversion_data?.converted_pdf) {
      const blob = await downloadPdfBlob(
        toRelativeApiPath(payload.conversion_data.converted_pdf)
      );
      const baseName =
        files.length === 1
          ? files[0].name.replace(/\.[^/.]+$/, ".pdf")
          : "combined-images.pdf";
      blobs.push({ name: baseName, blob });
    } else if (payload.conversion_data?.pdfs?.length) {
      for (const entry of payload.conversion_data.pdfs) {
        const blob = await downloadPdfBlob(toRelativeApiPath(entry.converted_pdf));
        blobs.push({
          name: entry.filename || entry.original_name.replace(/\.[^/.]+$/, ".pdf"),
          blob,
        });
      }
    } else {
      throw new Error("Conversion failed: server did not return download URL(s).");
    }

    for (const { blob } of blobs) {
      const headerBuf = await blob.slice(0, 5).arrayBuffer();
      const magic = new TextDecoder().decode(headerBuf);
      if (!magic.startsWith("%PDF")) {
        throw new Error("Server did not return a valid PDF for image conversion.");
      }
    }

    return { mode, blobs };
  } catch (e) {
    const net = formatConversionNetworkError(e);
    if (net) throw net;
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
        timeout: CONVERSION_POST_TIMEOUT_MS,
      }
    );

    const payload = postRes.data;
    if (payload?.error || !payload.conversion_data?.converted_pdf) {
      throw new Error(
        payload?.error ||
          "Conversion failed: server did not return a download URL."
      );
    }

    const docxConversionEngine = payload.conversion_data.docx_conversion_engine;
    const conversionEngine = payload.conversion_data.conversion_engine;
    const conversionWarning = payload.conversion_data.conversion_warning;

    const blob = await downloadPdfBlob(
      toRelativeApiPath(payload.conversion_data.converted_pdf)
    );

    return {
      blob,
      docxConversionEngine,
      conversionEngine,
      conversionWarning,
    };
  } catch (e) {
    const net = formatConversionNetworkError(e);
    if (net) throw net;
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
