import { type KatexOptions, renderToString } from "katex";

const defaultOptions = {
  output: "html",
  strict: true,
  throwOnError: false,
} as const satisfies KatexOptions;

// Escapes text for safe use inside a double-quoted HTML attribute value.
function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

// Wraps rendered KaTeX markup in a span carrying the original LaTeX source in a `data-tex`
// attribute, so a click handler elsewhere can recover the source to copy to the clipboard.
function withTexData(value: string, html: string): string {
  return `<span data-tex="${escapeAttribute(value.trim())}">${html}</span>`;
}

export function katexDisplay(value: string, options: KatexOptions): string {
  options = { ...defaultOptions, ...options, displayMode: true };
  try {
    return withTexData(value, renderToString(value, options)) + "\n";
  } catch (err) {
    // Sometimes KaTeX throws errors even if throwOnError is false.
    // In such a case we should handle the errors ourselves.
    if (options.throwOnError) {
      throw err;
    } else {
      return `<span style="color:red">${(err as Error).message}</span>`;
    }
  }
}

export function katexInline(value: string, options: KatexOptions): string {
  options = { ...defaultOptions, ...options, displayMode: false };
  try {
    return withTexData(value, renderToString(value, options));
  } catch (err) {
    // Sometimes KaTeX throws errors even if throwOnError is false.
    // In such a case we should handle the errors ourselves.
    if (options.throwOnError) {
      throw err;
    } else {
      return `<span style="color:red">${(err as Error).message}</span>`;
    }
  }
}
