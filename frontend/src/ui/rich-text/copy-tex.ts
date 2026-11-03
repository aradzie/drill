// Adapted from KaTeX's contrib/copy-tex (MIT): copying a selection that contains rendered formulas
// puts their TeX source on the clipboard as plain text. Upstream reads the source from MathML
// `<annotation>` elements; formulas here are rendered without MathML and carry their source in
// the `data-tex` attribute of the wrapper added by `katex.ts`.

const delimiters = {
  inline: ["$", "$"],
  display: ["$$", "$$"],
} as const;

// Returns the `data-tex` wrapper containing the node, if any.
function closestFormula(node: Node): Element | null {
  const element = node instanceof Element ? node : node.parentElement;
  return element?.closest("[data-tex]") ?? null;
}

// Replaces rendered formulas in the fragment with their delimited TeX source, in place.
export function replaceFormulasWithTex(fragment: DocumentFragment): DocumentFragment {
  for (const element of fragment.querySelectorAll("[data-tex]")) {
    const tex = element.getAttribute("data-tex") ?? "";
    const [open, close] = element.querySelector(".katex-display") ? delimiters.display : delimiters.inline;
    element.replaceWith(open + tex + close);
  }
  return fragment;
}

function handleCopy(event: ClipboardEvent) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !event.clipboardData) {
    return;
  }
  const range = selection.getRangeAt(0);

  // Expand a selection that starts or ends inside a formula to cover the whole formula.
  const start = closestFormula(range.startContainer);
  if (start) {
    range.setStartBefore(start);
  }
  const end = closestFormula(range.endContainer);
  if (end) {
    range.setEndAfter(end);
  }

  const fragment = range.cloneContents();
  if (!fragment.querySelector("[data-tex]")) {
    return;
  }

  // Keep the rendered HTML for rich-text targets; rewrite only the plain-text version.
  const html = Array.from(fragment.childNodes, (node) =>
    node instanceof Element ? node.outerHTML : (node.textContent ?? ""),
  ).join("");
  event.clipboardData.setData("text/html", html);
  event.clipboardData.setData("text/plain", replaceFormulasWithTex(fragment).textContent);
  event.preventDefault();
}

export function installCopyTex() {
  document.addEventListener("copy", handleCopy);
}
