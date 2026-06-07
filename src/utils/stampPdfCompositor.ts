import type { PDFDocumentProxy } from "pdfjs-dist";

export type StampWatermarkType = "text" | "image";

export type StampPlacement = { x: number; y: number };

export type StampComposeOptions = {
  watermarkType: StampWatermarkType;
  watermarkText: string;
  fontSize: number;
  fontFamily: "Helvetica" | "Times" | "Courier";
  textColor: string;
  rotation: number;
  opacity: number;
  imageUrl: string | null;
  mosaicMode: boolean;
  behindContent: boolean;
  positionX: number;
  positionY: number;
};

export const DEFAULT_STAMP_TEXT = "LexOrbit";

export const MOSAIC_POSITIONS: StampPlacement[] = [
  { x: 16.67, y: 83.33 },
  { x: 50, y: 83.33 },
  { x: 83.33, y: 83.33 },
  { x: 16.67, y: 50 },
  { x: 50, y: 50 },
  { x: 83.33, y: 50 },
  { x: 16.67, y: 16.67 },
  { x: 50, y: 16.67 },
  { x: 83.33, y: 16.67 },
];

/** Scale used when rasterizing pages for export (2× ≈ 144 DPI for letter size). */
export const STAMP_EXPORT_RENDER_SCALE = 2;

function resolvePositions(options: StampComposeOptions): StampPlacement[] {
  return options.mosaicMode
    ? MOSAIC_POSITIONS
    : [{ x: options.positionX, y: options.positionY }];
}

function canvasFontFamily(fontFamily: StampComposeOptions["fontFamily"]): string {
  if (fontFamily === "Times") return '"Times New Roman", Times, serif';
  if (fontFamily === "Courier") return '"Courier New", Courier, monospace';
  return "Helvetica, Arial, sans-serif";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load stamp image"));
    img.src = url;
  });
}

/** Draw text/image stamp onto a 2D canvas (top-left origin, pixel coords). */
export async function drawStampOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  renderScale: number,
  options: StampComposeOptions,
  opacityScale = 1,
): Promise<void> {
  const positions = resolvePositions(options);

  let cachedImage: HTMLImageElement | null = null;
  if (options.watermarkType === "image" && options.imageUrl) {
    cachedImage = await loadImage(options.imageUrl);
  }

  const alpha = Math.min(1, Math.max(0, (options.opacity / 100) * opacityScale));

  for (const pos of positions) {
    const centerX = (pos.x / 100) * width;
    const centerY = ((100 - pos.y) / 100) * height;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((-options.rotation * Math.PI) / 180);
    ctx.globalAlpha = alpha;

    if (options.watermarkType === "text" && options.watermarkText.trim()) {
      const pxSize = options.fontSize * renderScale;
      ctx.font = `bold ${pxSize}px ${canvasFontFamily(options.fontFamily)}`;
      ctx.fillStyle = options.textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(options.watermarkText, 0, 0);
    } else if (cachedImage) {
      const imgW = 200 * renderScale;
      const imgH = (cachedImage.height / cachedImage.width) * imgW;
      ctx.drawImage(cachedImage, -imgW / 2, -imgH / 2, imgW, imgH);
    }

    ctx.restore();
  }
}

export type CompositedPageResult = {
  pdfWidth: number;
  pdfHeight: number;
  pngBytes: Uint8Array;
};

/**
 * Render one PDF page with stamp composited.
 *
 * - **On top:** page first, then stamp painted over content.
 * - **Behind content:** page first, then stamp with `multiply` blend so text stays dominant.
 */
export async function composeStampedPage(
  pdfDoc: PDFDocumentProxy,
  pageIndex: number,
  options: StampComposeOptions,
  renderScale = STAMP_EXPORT_RENDER_SCALE,
): Promise<CompositedPageResult> {
  const page = await pdfDoc.getPage(pageIndex + 1);
  const pdfViewport = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: renderScale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  } as Parameters<typeof page.render>[0]).promise;

  if (options.behindContent) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    await drawStampOnCanvas(ctx, canvas.width, canvas.height, renderScale, {
      ...options,
      textColor: "#888888",
      opacity: Math.min(options.opacity, 45),
    });
    ctx.restore();
  } else {
    await drawStampOnCanvas(ctx, canvas.width, canvas.height, renderScale, options);
  }

  const dataUrl = canvas.toDataURL("image/png");
  const pngBytes = await fetch(dataUrl)
    .then((r) => r.arrayBuffer())
    .then((b) => new Uint8Array(b));

  return {
    pdfWidth: pdfViewport.width,
    pdfHeight: pdfViewport.height,
    pngBytes,
  };
}

export function stampComposeOptionsFromSettings(settings: {
  watermarkType: StampWatermarkType;
  watermarkText: string;
  fontSize: number;
  fontFamily: "Helvetica" | "Times" | "Courier";
  textColor: string;
  rotation: number;
  opacity: number;
  imageUrl: string | null;
  positionX: number;
  positionY: number;
  mosaicMode: boolean;
  behindContent: boolean;
}): StampComposeOptions {
  return { ...settings };
}

export function previewRenderScale(pdfPageWidthPt: number, displayWidthPx: number): number {
  if (!displayWidthPx || !pdfPageWidthPt) return 1.25;
  return Math.min(STAMP_EXPORT_RENDER_SCALE, Math.max(1, displayWidthPx / pdfPageWidthPt));
}

export function pngBytesToObjectUrl(pngBytes: Uint8Array): string {
  const copy = new Uint8Array(pngBytes);
  return URL.createObjectURL(new Blob([copy], { type: "image/png" }));
}

/** Stable string key for debounced behind-content preview recomposes. */
export function stampPreviewCacheKey(options: StampComposeOptions): string {
  return [
    options.watermarkType,
    options.watermarkText,
    options.fontSize,
    options.fontFamily,
    options.textColor,
    options.rotation,
    options.opacity,
    options.imageUrl ?? "",
    options.mosaicMode,
    options.behindContent,
    options.positionX,
    options.positionY,
  ].join("|");
}
