import { useEffect } from "react";
import { copyToClipboard } from "./CopiedPreview.tsx";

export function useCopyMath() {
  useEffect(() => {
    // Capture the copy gesture before it opens a problem or toggles a hint.
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
}

function handleClick(event: MouseEvent) {
  if (!event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
    return;
  }
  if (!(event.target instanceof Element)) {
    return;
  }
  let tex = event.target.closest("[data-tex]")?.getAttribute("data-tex")?.trim();
  if (tex && (tex.endsWith(".") || tex.endsWith(","))) {
    tex = tex.substring(0, tex.length - 1);
  }
  if (tex) {
    event.preventDefault();
    event.stopPropagation();
    void copyToClipboard(tex);
  }
}
