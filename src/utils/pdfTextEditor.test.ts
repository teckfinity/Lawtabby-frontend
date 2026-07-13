import { describe, expect, it } from "vitest";

/** Mirrors pdfTextEditor darkest-pixel logic for regression tests. */
function pickTextColorFromPixels(
  pixels: Array<{ r: number; g: number; b: number }>,
  background: { r: number; g: number; b: number },
): { r: number; g: number; b: number } {
  const lum = (c: { r: number; g: number; b: number }) =>
    c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
  const bgLum = lum(background);
  const fg = pixels.filter((p) => Math.abs(lum(p) - bgLum) > 0.12);
  if (!fg.length) return bgLum > 0.5 ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 };
  fg.sort((a, b) => lum(a) - lum(b));
  const darkest = fg.slice(0, Math.max(1, Math.floor(fg.length * 0.15)));
  return {
    r: darkest.reduce((s, p) => s + p.r, 0) / darkest.length,
    g: darkest.reduce((s, p) => s + p.g, 0) / darkest.length,
    b: darkest.reduce((s, p) => s + p.b, 0) / darkest.length,
  };
}

describe("pdf text color extraction", () => {
  it("does not return light gray when black text is anti-aliased on white", () => {
    const background = { r: 1, g: 1, b: 1 };
    const pixels = [
      ...Array.from({ length: 80 }, () => ({ r: 1, g: 1, b: 1 })),
      ...Array.from({ length: 15 }, () => ({ r: 0.75, g: 0.75, b: 0.75 })),
      ...Array.from({ length: 5 }, () => ({ r: 0, g: 0, b: 0 })),
    ];
    const color = pickTextColorFromPixels(pixels, background);
    expect(color.r).toBeLessThan(0.15);
    expect(color.g).toBeLessThan(0.15);
    expect(color.b).toBeLessThan(0.15);
  });

  it("preserves gray text on white background", () => {
    const background = { r: 1, g: 1, b: 1 };
    const gray = 0.45;
    const pixels = [
      ...Array.from({ length: 70 }, () => ({ r: 1, g: 1, b: 1 })),
      ...Array.from({ length: 30 }, () => ({ r: gray, g: gray, b: gray })),
    ];
    const color = pickTextColorFromPixels(pixels, background);
    expect(color.r).toBeGreaterThan(0.3);
    expect(color.r).toBeLessThan(0.55);
  });
});
