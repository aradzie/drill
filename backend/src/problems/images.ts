import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const assetsPrefix = "/api/assets/";

/**
 * Rewrites simple inline Markdown image paths without changing other Markdown.
 * Alt text may contain balanced brackets, such as "on [-2, 2]".
 */
export function rewriteImageUrls(markdown: string, notePath: string, root: string): string {
  let result = "";
  let copied = 0; // Everything before this index is already in `result`.
  let position = 0;

  while (position < markdown.length) {
    const start = markdown.indexOf("![", position);
    if (start === -1) {
      break;
    }
    const image = scanImage(markdown, start);
    if (!image) {
      position = start + 1;
      continue;
    }
    const rewritten = rewriteUrl(image.url, notePath, root);
    if (rewritten != null) {
      result += markdown.slice(copied, image.urlStart) + rewritten;
      copied = image.urlEnd;
    }
    position = image.urlEnd;
  }
  return result + markdown.slice(copied);
}

type ScannedImage = { url: string; urlStart: number; urlEnd: number };

/** Scans `![alt](url)` at `start`, or returns null if the text there is not a simple inline image. */
function scanImage(text: string, start: number): ScannedImage | null {
  type State = "alt" | "open" | "url";
  let state: State = "alt";
  let depth = 1; // Open square brackets, counting the one in "![".
  let urlStart = 0;

  for (let i = start + 2; i < text.length; i++) {
    const char = text[i];
    switch (state) {
      case "alt":
        if (char === "\n") {
          return null;
        } else if (char === "[") {
          depth++;
        } else if (char === "]" && --depth === 0) {
          state = "open";
        }
        break;
      case "open":
        if (char !== "(") {
          return null;
        }
        state = "url";
        urlStart = i + 1;
        break;
      case "url":
        if (/\s/.test(char)) {
          return null;
        }
        if (char === ")") {
          return i > urlStart ? { url: text.slice(urlStart, i), urlStart, urlEnd: i } : null;
        }
        break;
    }
  }
  return null;
}

/** Returns the asset URL for a relative image path under `root`, or null to leave it unchanged. */
function rewriteUrl(url: string, notePath: string, root: string): string | null {
  let resolved: URL;
  let file: string;
  try {
    // Resolving against the note's location, as a browser would, rejects other schemes
    // (non-file protocols) and splits off the query and fragment.
    resolved = new URL(url, pathToFileURL(notePath));
    if (resolved.protocol !== "file:") {
      return null;
    }
    file = fileURLToPath(resolved);
  } catch {
    return null; // Malformed escapes, or a host that is not a local path.
  }
  if (!/\.(?:svg|png|jpg)$/i.test(file)) {
    return null;
  }
  const relative = path.relative(path.resolve(root), file);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return null;
  }
  const urlPath = relative.split(path.sep).map(encodeURIComponent).join("/");
  return `${assetsPrefix}${urlPath}${resolved.search}${resolved.hash}`;
}
