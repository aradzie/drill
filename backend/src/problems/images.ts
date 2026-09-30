import path from "node:path";

export const assetsPrefix = "/api/assets/";

/** Rewrites simple inline Markdown image paths without changing other Markdown. */
export function rewriteImageUrls(markdown: string, notePath: string, root: string): string {
  return markdown.replace(/(!\[[^\]\n]*\]\()([^\s)]+)(?=\))/g, (match, opening, url) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url)) {
      return match;
    }
    const [filename, suffix = ""] = /^([^?#]+)(.*)$/.exec(url)?.slice(1) ?? [];
    if (!filename || !/\.(?:svg|png|jpg)$/i.test(filename)) {
      return match;
    }
    let decoded: string;
    try {
      decoded = decodeURIComponent(filename);
    } catch {
      return match;
    }
    const relative = path.relative(path.resolve(root), path.resolve(path.dirname(notePath), decoded));
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      return match;
    }
    const urlPath = relative.split(path.sep).map(encodeURIComponent).join("/");
    return `${opening}${assetsPrefix}${urlPath}${suffix}`;
  });
}
