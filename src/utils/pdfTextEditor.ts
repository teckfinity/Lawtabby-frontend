import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/** A selectable / editable text region on one PDF page. */
export interface PdfTextBlock {
  id: string;
  pageIndex: number;
  text: string;
  originalText: string;
  /** Display overlay (CSS px, top-left origin). */
  displayX: number;
  displayY: number;
  displayWidth: number;
  displayHeight: number;
  /** PDF points for pdf-lib (bottom-left origin). */
  pdfX: number;
  pdfBaseline: number;
  pdfCoverX: number;
  pdfCoverY: number;
  pdfCoverWidth: number;
  pdfCoverHeight: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
}

export interface PdfEditorPage {
  pageIndex: number;
  pdfWidth: number;
  pdfHeight: number;
  displayWidth: number;
  displayHeight: number;
  backgroundUrl: string;
  blocks: PdfTextBlock[];
}

type PdfJsTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
};

type RawLineItem = {
  str: string;
  displayX: number;
  displayY: number;
  displayWidth: number;
  displayHeight: number;
  pdfX: number;
  pdfBaseline: number;
  fontSize: number;
  fontName: string;
};

const DISPLAY_MAX_WIDTH = 760;
const RENDER_SCALE = 2;

function detectFont(fontName: string): {
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
} {
  const name = (fontName || "").toLowerCase();
  let fontFamily = "Helvetica";
  if (name.includes("times")) fontFamily = "Times-Roman";
  else if (name.includes("courier")) fontFamily = "Courier";
  else if (name.includes("helv") || name.includes("arial")) fontFamily = "Helvetica";

  const fontWeight: "normal" | "bold" = name.includes("bold") ? "bold" : "normal";
  const fontStyle: "normal" | "italic" =
    name.includes("italic") || name.includes("oblique") ? "italic" : "normal";

  return { fontFamily, fontWeight, fontStyle };
}

function transformTextItem(
  item: PdfJsTextItem,
  pdfViewport: { width: number; height: number; transform: number[] },
  displayViewport: { width: number; height: number; transform: number[] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfjsUtil: { transform: (m1: number[], m2: number[]) => number[] },
): RawLineItem | null {
  const str = item.str?.replace(/\s+$/, "") ?? "";
  if (!str.trim()) return null;

  const pdfTm = pdfjsUtil.transform(pdfViewport.transform, item.transform);
  const displayTm = pdfjsUtil.transform(displayViewport.transform, item.transform);

  const fontSize = Math.hypot(item.transform[0], item.transform[1]);
  const displayFontSize = Math.hypot(displayTm[0], displayTm[1]);
  const displayX = displayTm[4];
  const displayBaseline = displayTm[5];
  const displayY = displayBaseline - displayFontSize;
  const displayWidth = Math.max(item.width * (displayViewport.width / pdfViewport.width), fontSize * 0.4);
  const displayHeight = Math.max(displayFontSize * 1.35, 12);

  return {
    str,
    displayX,
    displayY,
    displayWidth,
    displayHeight,
    pdfX: pdfTm[4],
    pdfBaseline: pdfTm[5],
    fontSize,
    fontName: item.fontName || "",
  };
}

function groupLineItems(items: RawLineItem[]): RawLineItem[][] {
  const sorted = [...items].sort((a, b) => a.displayY - b.displayY || a.displayX - b.displayX);
  const lines: RawLineItem[][] = [];
  let current: RawLineItem[] = [];
  let lineY = Number.NaN;

  for (const item of sorted) {
    const threshold = Math.max(item.displayHeight * 0.55, 4);
    if (!current.length || Math.abs(item.displayY - lineY) <= threshold) {
      current.push(item);
      lineY = current.length === 1 ? item.displayY : (lineY + item.displayY) / 2;
    } else {
      lines.push(current);
      current = [item];
      lineY = item.displayY;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

function mergeLineToBlock(line: RawLineItem[], pageIndex: number): PdfTextBlock {
  const text = line
    .map((item) => item.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const displayX = Math.min(...line.map((i) => i.displayX));
  const displayY = Math.min(...line.map((i) => i.displayY));
  const displayRight = Math.max(...line.map((i) => i.displayX + i.displayWidth));
  const displayBottom = Math.max(...line.map((i) => i.displayY + i.displayHeight));

  const pdfX = Math.min(...line.map((i) => i.pdfX));
  const pdfBaseline = line[0].pdfBaseline;
  const fontSize = Math.max(...line.map((i) => i.fontSize));
  const fontName = line[0].fontName;
  const { fontFamily, fontWeight, fontStyle } = detectFont(fontName);

  const padX = Math.max(2, fontSize * 0.15);
  const padY = Math.max(2, fontSize * 0.2);
  const coverHeight = fontSize * 1.25 + padY * 2;

  return {
    id: `block-${pageIndex}-${displayX.toFixed(1)}-${displayY.toFixed(1)}`,
    pageIndex,
    text,
    originalText: text,
    displayX,
    displayY,
    displayWidth: Math.max(displayRight - displayX, fontSize * Math.max(text.length * 0.45, 2)),
    displayHeight: Math.max(displayBottom - displayY, fontSize * 1.2),
    pdfX,
    pdfBaseline,
    pdfCoverX: pdfX - padX,
    pdfCoverY: pdfBaseline - fontSize - padY,
    pdfCoverWidth: Math.max(displayRight - displayX, fontSize * Math.max(text.length * 0.5, 2)) + padX * 2,
    pdfCoverHeight: coverHeight,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
  };
}

/** Extract pages, background images, and grouped editable text blocks from a PDF file. */
export async function extractPdfEditorPages(file: File): Promise<PdfEditorPage[]> {
  const pdfjsLib = await import("pdfjs-dist");
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;

  const pages: PdfEditorPage[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const pdfViewport = page.getViewport({ scale: 1 });
    const displayScale = DISPLAY_MAX_WIDTH / pdfViewport.width;
    const displayViewport = page.getViewport({ scale: displayScale });
    const renderViewport = page.getViewport({ scale: displayScale * RENDER_SCALE });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);

    await page.render({
      canvasContext: ctx,
      viewport: renderViewport,
      canvas,
    } as Parameters<typeof page.render>[0]).promise;

    const backgroundUrl = canvas.toDataURL("image/jpeg", 0.92);
    const textContent = await page.getTextContent();

    const rawItems: RawLineItem[] = [];
    for (const item of textContent.items as PdfJsTextItem[]) {
      const parsed = transformTextItem(item, pdfViewport, displayViewport, pdfjsLib.Util);
      if (parsed) rawItems.push(parsed);
    }

    const blocks = groupLineItems(rawItems).map((line) =>
      mergeLineToBlock(line, pageNum - 1),
    );

    pages.push({
      pageIndex: pageNum - 1,
      pdfWidth: pdfViewport.width,
      pdfHeight: pdfViewport.height,
      displayWidth: displayViewport.width,
      displayHeight: displayViewport.height,
      backgroundUrl,
      blocks,
    });
  }

  return pages;
}

function pickFont(
  block: PdfTextBlock,
  fonts: {
    helvetica: PDFFont;
    helveticaBold: PDFFont;
    times: PDFFont;
    timesBold: PDFFont;
    courier: PDFFont;
  },
): PDFFont {
  const isBold = block.fontWeight === "bold";
  if (block.fontFamily.startsWith("Times")) {
    return isBold ? fonts.timesBold : fonts.times;
  }
  if (block.fontFamily.startsWith("Courier")) {
    return fonts.courier;
  }
  return isBold ? fonts.helveticaBold : fonts.helvetica;
}

/** Apply edited text blocks back onto the original PDF (vector, not rasterized). */
export async function savePdfTextEdits(
  originalFile: File,
  pages: PdfEditorPage[],
): Promise<Uint8Array> {
  const pdfBytes = await originalFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const docPages = pdfDoc.getPages();

  const fonts = {
    helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    courier: await pdfDoc.embedFont(StandardFonts.Courier),
  };

  for (const pageData of pages) {
    const page = docPages[pageData.pageIndex];
    if (!page) continue;

    for (const block of pageData.blocks) {
      if (block.text.trim() === block.originalText.trim()) continue;
      applyTextBlockEdit(page, block, fonts);
    }
  }

  return pdfDoc.save();
}

function applyTextBlockEdit(
  page: PDFPage,
  block: PdfTextBlock,
  fonts: {
    helvetica: PDFFont;
    helveticaBold: PDFFont;
    times: PDFFont;
    timesBold: PDFFont;
    courier: PDFFont;
  },
) {
  const { height: pageHeight } = page.getSize();
  const coverBottom = pageHeight - block.pdfCoverY - block.pdfCoverHeight;

  page.drawRectangle({
    x: block.pdfCoverX,
    y: coverBottom,
    width: block.pdfCoverWidth,
    height: block.pdfCoverHeight,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  const font = pickFont(block, fonts);
  const textY = pageHeight - block.pdfBaseline;

  page.drawText(block.text, {
    x: block.pdfX,
    y: textY,
    size: block.fontSize,
    font,
    color: rgb(0, 0, 0),
    maxWidth: block.pdfCoverWidth,
    lineHeight: block.fontSize * 1.15,
  });
}

export function countModifiedBlocks(pages: PdfEditorPage[]): number {
  return pages.reduce(
    (n, page) =>
      n + page.blocks.filter((b) => b.text.trim() !== b.originalText.trim()).length,
    0,
  );
}
