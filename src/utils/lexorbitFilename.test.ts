import { describe, expect, it } from "vitest";
import {
  buildLexorbitConvertedFilename,
  buildLexorbitFilenameFromUploads,
  buildLexorbitProcessedFilename,
  buildPdfToFormatDownloadName,
  sanitizeFilenameStem,
} from "./lexorbitFilename";

describe("sanitizeFilenameStem", () => {
  it("strips path and extension", () => {
    expect(sanitizeFilenameStem("/path/to/test.pdf")).toBe("test");
  });

  it("preserves unicode", () => {
    expect(sanitizeFilenameStem("résumé.pdf")).toBe("résumé");
  });

  it("replaces unsafe characters", () => {
    expect(sanitizeFilenameStem('bad:name|test.pdf')).toBe("bad_name_test");
  });
});

describe("buildLexorbitProcessedFilename", () => {
  const cases: Array<[string, Parameters<typeof buildLexorbitProcessedFilename>[1], string]> = [
    ["test.pdf", "merged", "test_lexorbit_merged.pdf"],
    ["test.pdf", "split", "test_lexorbit_split.pdf"],
    ["test.pdf", "compressed", "test_lexorbit_compressed.pdf"],
    ["test.pdf", "edited", "test_lexorbit_edited.pdf"],
    ["test.pdf", "signed", "test_lexorbit_signed.pdf"],
    ["test.pdf", "stamped", "test_lexorbit_stamped.pdf"],
    ["test.pdf", "ocr", "test_lexorbit_ocr.pdf"],
    ["test.pdf", "organized", "test_lexorbit_organized.pdf"],
    ["test.pdf", "unlocked", "test_lexorbit_unlocked.pdf"],
    ["test.pdf", "protected", "test_lexorbit_protected.pdf"],
  ];

  it.each(cases)("maps %s + %s", (input, op, expected) => {
    expect(buildLexorbitProcessedFilename(input, op)).toBe(expected);
  });

  it("avoids duplicate .pdf.pdf", () => {
    const name = buildLexorbitProcessedFilename("test.pdf", "merged");
    expect(name.endsWith(".pdf.pdf")).toBe(false);
  });

  it("supports zip for split bundles", () => {
    expect(buildLexorbitProcessedFilename("test.pdf", "split", "zip")).toBe(
      "test_lexorbit_split.zip",
    );
  });
});

describe("buildLexorbitConvertedFilename", () => {
  it("pdf to word", () => {
    expect(buildLexorbitConvertedFilename("test.pdf", "docx")).toBe("test_lexorbit.docx");
  });

  it("word to pdf", () => {
    expect(buildLexorbitConvertedFilename("document.docx", "pdf")).toBe(
      "document_lexorbit.pdf",
    );
  });
});

describe("buildLexorbitFilenameFromUploads", () => {
  it("uses first file for merge", () => {
    expect(
      buildLexorbitFilenameFromUploads(["contract.pdf", "appendix.pdf"], "merged"),
    ).toBe("contract_lexorbit_merged.pdf");
  });
});

describe("buildPdfToFormatDownloadName", () => {
  it("maps word format to docx", () => {
    expect(buildPdfToFormatDownloadName("test.pdf", "docx")).toBe("test_lexorbit.docx");
  });
});
