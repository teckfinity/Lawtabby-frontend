import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PDFPageProxy } from "pdfjs-dist";
import { pdfjs as pdfjsLib } from "@/lib/pdfjsWorker";

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
  /** Sampled from page background (0–1 RGB) for invisible text replacement. */
  coverColor: { r: number; g: number; b: number };
  textColor: { r: number; g: number; b: number };
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
  textColor?: Rgb01;
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

type Rgb01 = { r: number; g: number; b: number };

function luminance(c: Rgb01): number {
  return c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
}

function cmykToRgb(c: number, m: number, y: number, k: number): Rgb01 {
  return {
    r: 1 - Math.min(1, c + k),
    g: 1 - Math.min(1, m + k),
    b: 1 - Math.min(1, y + k),
  };
}

function medianRgb(colors: Rgb01[]): Rgb01 {
  if (colors.length === 1) return colors[0];
  const sorted = [...colors].sort((a, b) => luminance(a) - luminance(b));
  const mid = sorted[Math.floor(sorted.length / 2)];
  return { ...mid };
}

/** Read fill colors from PDF drawing ops in the same order as getTextContent items. */
async function extractShowTextFillColors(page: PDFPageProxy): Promise<Rgb01[]> {
  const OPS = pdfjsLib.OPS;
  const opList = await page.getOperatorList();
  const { fnArray, argsArray } = opList;

  let fillColor: Rgb01 = { r: 0, g: 0, b: 0 };
  const colors: Rgb01[] = [];

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i];

    if (fn === OPS.setFillRGBColor) {
      fillColor = { r: args[0], g: args[1], b: args[2] };
    } else if (fn === OPS.setFillGray) {
      fillColor = { r: args[0], g: args[0], b: args[0] };
    } else if (fn === OPS.setFillCMYKColor) {
      fillColor = cmykToRgb(args[0], args[1], args[2], args[3]);
    } else if (fn === OPS.showText || fn === OPS.showSpacedText) {
      colors.push({ ...fillColor });
    }
  }

  return colors;
}

function resolveLineTextColor(
  line: RawLineItem[],
  ctx: CanvasRenderingContext2D,
  displayX: number,
  displayY: number,
  displayWidth: number,
  displayHeight: number,
  background: Rgb01,
): Rgb01 {
  const fromPdf = line.map((i) => i.textColor).filter((c): c is Rgb01 => !!c);
  if (fromPdf.length) {
    return medianRgb(fromPdf);
  }
  return extractTextColorFromCanvas(
    ctx,
    displayX,
    displayY,
    displayWidth,
    displayHeight,
    background,
  );
}

function sampleCanvasPatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): Rgb01 {
  const scale = RENDER_SCALE;
  const sx = Math.max(0, Math.floor(x * scale));
  const sy = Math.max(0, Math.floor(y * scale));
  const sw = Math.max(1, Math.floor(w * scale));
  const sh = Math.max(1, Math.floor(h * scale));
  const maxW = ctx.canvas.width - sx;
  const maxH = ctx.canvas.height - sy;
  if (maxW <= 0 || maxH <= 0) {
    return { r: 1, g: 1, b: 1 };
  }
  const data = ctx.getImageData(sx, sy, Math.min(sw, maxW), Math.min(sh, maxH)).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 16) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n++;
  }
  if (!n) return { r: 1, g: 1, b: 1 };
  return { r: r / n / 255, g: g / n / 255, b: b / n / 255 };
}

function sampleBackgroundForBlock(
  ctx: CanvasRenderingContext2D,
  displayX: number,
  displayY: number,
  displayWidth: number,
  displayHeight: number,
): Rgb01 {
  const pad = 2;
  const patches = [
    sampleCanvasPatch(ctx, displayX - pad, displayY - pad, pad * 2, pad * 2),
    sampleCanvasPatch(
      ctx,
      displayX + displayWidth - pad,
      displayY - pad,
      pad * 2,
      pad * 2,
    ),
    sampleCanvasPatch(
      ctx,
      displayX - pad,
      displayY + displayHeight - pad,
      pad * 2,
      pad * 2,
    ),
    sampleCanvasPatch(
      ctx,
      displayX + displayWidth - pad,
      displayY + displayHeight - pad,
      pad * 2,
      pad * 2,
    ),
  ];
  return {
    r: patches.reduce((s, p) => s + p.r, 0) / patches.length,
    g: patches.reduce((s, p) => s + p.g, 0) / patches.length,
    b: patches.reduce((s, p) => s + p.b, 0) / patches.length,
  };
}

/**
 * Fallback when PDF operator colors are unavailable: pick the darkest (or
 * lightest on dark backgrounds) foreground pixels — not the average, which
 * blends anti-aliased edges into light gray.
 */
function extractTextColorFromCanvas(
  ctx: CanvasRenderingContext2D,
  displayX: number,
  displayY: number,
  displayWidth: number,
  displayHeight: number,
  background: Rgb01,
): Rgb01 {
  const scale = RENDER_SCALE;
  const sx = Math.max(0, Math.floor(displayX * scale));
  const sy = Math.max(0, Math.floor(displayY * scale));
  const sw = Math.max(1, Math.floor(displayWidth * scale));
  const sh = Math.max(1, Math.floor(displayHeight * scale));
  const maxW = ctx.canvas.width - sx;
  const maxH = ctx.canvas.height - sy;
  if (maxW <= 0 || maxH <= 0) {
    return luminance(background) > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 };
  }

  const data = ctx.getImageData(sx, sy, Math.min(sw, maxW), Math.min(sh, maxH)).data;
  const bgLum = luminance(background);
  const fgPixels: Rgb01[] = [];

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const p = { r: data[i] / 255, g: data[i + 1] / 255, b: data[i + 2] / 255 };
    if (Math.abs(luminance(p) - bgLum) > 0.12) {
      fgPixels.push(p);
    }
  }

  if (!fgPixels.length) {
    return bgLum > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 };
  }

  if (bgLum > 0.5) {
    fgPixels.sort((a, b) => luminance(a) - luminance(b));
    const darkest = fgPixels.slice(0, Math.max(1, Math.floor(fgPixels.length * 0.15)));
    return {
      r: darkest.reduce((s, p) => s + p.r, 0) / darkest.length,
      g: darkest.reduce((s, p) => s + p.g, 0) / darkest.length,
      b: darkest.reduce((s, p) => s + p.b, 0) / darkest.length,
    };
  }

  fgPixels.sort((a, b) => luminance(b) - luminance(a));
  const lightest = fgPixels.slice(0, Math.max(1, Math.floor(fgPixels.length * 0.15)));
  return {
    r: lightest.reduce((s, p) => s + p.r, 0) / lightest.length,
    g: lightest.reduce((s, p) => s + p.g, 0) / lightest.length,
    b: lightest.reduce((s, p) => s + p.b, 0) / lightest.length,
  };
}

function mergeLineToBlock(
  line: RawLineItem[],
  pageIndex: number,
  ctx: CanvasRenderingContext2D,
): PdfTextBlock {
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

  const padX = Math.max(1, fontSize * 0.08);
  const padY = Math.max(1, fontSize * 0.1);
  const coverHeight = fontSize * 1.15 + padY * 2;
  const coverColor = sampleBackgroundForBlock(ctx, displayX, displayY, displayRight - displayX, displayBottom - displayY);
  const textColor = resolveLineTextColor(
    line,
    ctx,
    displayX,
    displayY,
    displayRight - displayX,
    displayBottom - displayY,
    coverColor,
  );

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
    coverColor,
    textColor,
  };
}

/** Extract pages, background images, and grouped editable text blocks from a PDF file. */
export async function extractPdfEditorPages(file: File): Promise<PdfEditorPage[]> {
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
    const showTextColors = await extractShowTextFillColors(page);

    const rawItems: RawLineItem[] = [];
    let colorIndex = 0;
    for (const item of textContent.items as PdfJsTextItem[]) {
      if (!("str" in item)) continue;
      const itemColor = showTextColors[colorIndex] ?? { r: 0, g: 0, b: 0 };
      colorIndex++;
      const parsed = transformTextItem(item, pdfViewport, displayViewport, pdfjsLib.Util);
      if (parsed) {
        parsed.textColor = itemColor;
        rawItems.push(parsed);
      }
    }

    const blocks = groupLineItems(rawItems).map((line) =>
      mergeLineToBlock(line, pageNum - 1, ctx),
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
    helveticaOblique: PDFFont;
    helveticaBoldOblique: PDFFont;
    times: PDFFont;
    timesBold: PDFFont;
    timesItalic: PDFFont;
    timesBoldItalic: PDFFont;
    courier: PDFFont;
    courierOblique: PDFFont;
  },
): PDFFont {
  const isBold = block.fontWeight === "bold";
  const isItalic = block.fontStyle === "italic";

  if (block.fontFamily.startsWith("Times")) {
    if (isBold && isItalic) return fonts.timesBoldItalic;
    if (isBold) return fonts.timesBold;
    if (isItalic) return fonts.timesItalic;
    return fonts.times;
  }
  if (block.fontFamily.startsWith("Courier")) {
    return isItalic ? fonts.courierOblique : fonts.courier;
  }
  if (isBold && isItalic) return fonts.helveticaBoldOblique;
  if (isBold) return fonts.helveticaBold;
  if (isItalic) return fonts.helveticaOblique;
  return fonts.helvetica;
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
    helveticaOblique: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    helveticaBoldOblique: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    timesItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    timesBoldItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
    courier: await pdfDoc.embedFont(StandardFonts.Courier),
    courierOblique: await pdfDoc.embedFont(StandardFonts.CourierOblique),
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
    helveticaOblique: PDFFont;
    helveticaBoldOblique: PDFFont;
    times: PDFFont;
    timesBold: PDFFont;
    timesItalic: PDFFont;
    timesBoldItalic: PDFFont;
    courier: PDFFont;
    courierOblique: PDFFont;
  },
) {
  const { height: pageHeight } = page.getSize();
  const coverBottom = pageHeight - block.pdfCoverY - block.pdfCoverHeight;

  const bg = block.coverColor ?? { r: 1, g: 1, b: 1 };
  page.drawRectangle({
    x: block.pdfCoverX,
    y: coverBottom,
    width: block.pdfCoverWidth,
    height: block.pdfCoverHeight,
    color: rgb(bg.r, bg.g, bg.b),
    borderWidth: 0,
  });

  const font = pickFont(block, fonts);
  const textY = pageHeight - block.pdfBaseline;
  const fg = ensureTextContrast(block.textColor ?? { r: 0, g: 0, b: 0 }, bg);

  page.drawText(block.text, {
    x: block.pdfX,
    y: textY,
    size: block.fontSize,
    font,
    color: rgb(fg.r, fg.g, fg.b),
    maxWidth: block.pdfCoverWidth,
    lineHeight: block.fontSize * 1.15,
  });
}

export function ensureTextContrast(fg: Rgb01, bg: Rgb01): Rgb01 {
  if (Math.abs(luminance(fg) - luminance(bg)) >= 0.35) {
    return fg;
  }
  return luminance(bg) > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 };
}

export function rgb01ToCss(c: Rgb01): string {
  return `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
}

export function countModifiedBlocks(pages: PdfEditorPage[]): number {
  return pages.reduce(
    (n, page) =>
      n + page.blocks.filter((b) => b.text.trim() !== b.originalText.trim()).length,
    0,
  );
}
