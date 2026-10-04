import { themeColor } from "./theme-color.ts";

const svgNamespace = "http://www.w3.org/2000/svg";

function imageUrl(src: string | null): URL | null {
  if (!src) return null;
  try {
    const url = new URL(src, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function prepareSvg(markup: string): string | null {
  const document = new DOMParser().parseFromString(markup, "image/svg+xml");
  const svg = document.documentElement;
  if (document.querySelector("parsererror") || !(svg instanceof SVGSVGElement) || svg.namespaceURI !== svgNamespace)
    return null;
  if (svg.querySelector("style")) return null;

  for (const element of [svg, ...svg.querySelectorAll("*")]) {
    for (const property of ["fill", "stroke", "color", "stop-color", "flood-color"]) {
      const attribute = element.getAttribute(property);
      if (attribute) {
        element.setAttribute(property, themeColor(attribute));
      }
      const style = (element as SVGElement).style;
      const styled = style.getPropertyValue(property);
      if (styled) {
        style.setProperty(property, themeColor(styled), style.getPropertyPriority(property));
      }
    }
  }

  // The default SVG fill is black. Make uncolored shapes follow the same theme rule.
  if (!svg.hasAttribute("fill") && !svg.style.fill) svg.setAttribute("fill", themeColor("black"));
  if (!svg.hasAttribute("color") && !svg.style.color) svg.setAttribute("color", themeColor("black"));
  svg.style.colorScheme = "light dark";
  return new XMLSerializer().serializeToString(svg);
}

function asDataUrl(markup: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(new Blob([markup], { type: "image/svg+xml" }));
  });
}

async function loadImageUrl(url: URL): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (response.ok && response.headers.get("content-type")?.toLowerCase().startsWith("image/svg+xml")) {
      const svg = prepareSvg(await response.text());
      if (svg) {
        return asDataUrl(svg);
      }
    }
  } catch (err) {
    console.error(err);
  }
  return null;
}

/** Change SVG image URLs in rendered HTML, leaving the original img elements intact. */
export async function themeSvgImages(html: string): Promise<string> {
  if (!/<img\b/i.test(html)) return html;
  const document = new DOMParser().parseFromString(html, "text/html");
  let changed = false;
  await Promise.all(
    [...document.body.querySelectorAll("img")].map(async (image) => {
      if (image.hasAttribute("srcset")) return;
      const url = imageUrl(image.getAttribute("src"));
      if (!url) return;
      const dataUrl = await loadImageUrl(url);
      if (dataUrl) {
        image.setAttribute("src", dataUrl + url.hash);
        changed = true;
      }
    }),
  );
  return changed ? document.body.innerHTML : html;
}
