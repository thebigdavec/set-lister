import { BASE_FONT_SIZE_PX, DEFAULT_FONT_FAMILY } from "../constants";

export { BASE_FONT_SIZE_PX };

let cachedCanvas: HTMLCanvasElement | null = null;
let cachedContext: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (cachedContext) return cachedContext;

  cachedCanvas = document.createElement("canvas");
  cachedContext = cachedCanvas.getContext("2d");
  return cachedContext;
}

export function formatSongLabel(title: string, key?: string): string {
  const normalizedTitle = title?.trim().length ? title.trim() : "Untitled Song";
  const normalizedKey = key?.trim();
  return normalizedKey
    ? `${normalizedTitle} (${normalizedKey})`
    : normalizedTitle;
}

export function measureTextWidth(
  text: string,
  fontSize = BASE_FONT_SIZE_PX,
  fontWeight: number | string = 600,
): number {
  if (!text) return 0;
  const context = getContext();
  if (!context) {
    // Fallback heuristic for non-DOM environments (e.g. SSR, tests)
    return text.length * fontSize * 0.6;
  }

  context.font = `${fontWeight} ${fontSize}px ${DEFAULT_FONT_FAMILY}`;
  return context.measureText(text).width;
}

export function measureSongLabelWidth(
  title: string,
  key?: string,
  fontSize = BASE_FONT_SIZE_PX,
): number {
  return measureTextWidth(formatSongLabel(title, key), fontSize);
}
