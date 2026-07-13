/** LexOrbit download naming — keep original stem, append branded suffix. */

export type LexorbitPdfOperation =
  | "merged"
  | "split"
  | "compressed"
  | "edited"
  | "signed"
  | "stamped"
  | "ocr"
  | "organized"
  | "unlocked"
  | "protected";

const BRAND = "lexorbit";

/** Characters unsafe on Windows / macOS / Linux file systems. */
const UNSAFE_FILENAME_CHARS = /[\x00-\x1f<>:"/\\|?*]/g;

const MAX_STEM_LENGTH = 180;

/**
 * Strip path and extension; sanitize for cross-platform downloads.
 * Preserves Unicode letters/numbers where possible.
 */
export function sanitizeFilenameStem(
  originalFilename: string,
  defaultStem = "document",
): string {
  const base = (originalFilename.split(/[/\\]/).pop() ?? "").trim();
  if (!base) return defaultStem;

  const lastDot = base.lastIndexOf(".");
  const withoutExt = lastDot > 0 ? base.slice(0, lastDot) : base;

  let stem = withoutExt.replace(UNSAFE_FILENAME_CHARS, "_").trim();
  if (stem.length > MAX_STEM_LENGTH) {
    stem = stem.slice(0, MAX_STEM_LENGTH);
  }
  return stem || defaultStem;
}

/** `{stem}_lexorbit_{operation}.{ext}` — e.g. test_lexorbit_merged.pdf */
export function buildLexorbitProcessedFilename(
  originalFilename: string,
  operation: LexorbitPdfOperation,
  outputExt = "pdf",
): string {
  const stem = sanitizeFilenameStem(originalFilename);
  const ext = outputExt.replace(/^\./, "").toLowerCase() || "pdf";
  return `${stem}_${BRAND}_${operation}.${ext}`;
}

/** `{stem}_lexorbit.{ext}` — e.g. test_lexorbit.docx or document_lexorbit.pdf */
export function buildLexorbitConvertedFilename(
  originalFilename: string,
  outputExt: string,
): string {
  const stem = sanitizeFilenameStem(originalFilename);
  const ext = outputExt.replace(/^\./, "").toLowerCase() || "pdf";
  return `${stem}_${BRAND}.${ext}`;
}

/** Merge / multi-upload: first filename is the base. */
export function buildLexorbitFilenameFromUploads(
  originalFilenames: string[],
  operation: LexorbitPdfOperation,
  outputExt = "pdf",
): string {
  const base = originalFilenames[0] ?? "document.pdf";
  return buildLexorbitProcessedFilename(base, operation, outputExt);
}

const PDF_TO_FORMAT_EXT: Record<string, string> = {
  word: "docx",
  docx: "docx",
  excel: "xlsx",
  xlsx: "xlsx",
  powerpoint: "pptx",
  pptx: "pptx",
  jpeg: "zip",
  jpg: "zip",
  png: "zip",
  text: "txt",
  txt: "txt",
};

export function pdfToFormatOutputExt(formatKey: string): string {
  return PDF_TO_FORMAT_EXT[formatKey.toLowerCase()] ?? formatKey.toLowerCase();
}

export function buildPdfToFormatDownloadName(
  uploadName: string,
  formatKey: string,
): string {
  return buildLexorbitConvertedFilename(uploadName, pdfToFormatOutputExt(formatKey));
}

/** Trigger a browser download with an explicit filename. */
export function triggerBrowserDownload(href: string, filename: string): void {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    triggerBrowserDownload(url, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}
