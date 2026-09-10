import type { KatexOptions } from "katex";
import { katexDisplay, katexInline } from "./katex.ts";

export type MathType = "displayMathBlock" | "displayMath" | "inlineMath";
export type MathAltType = "displayAltMathBlock" | "displayAltMath" | "inlineAltMath";
export type MathRenderer = (code: string, type: MathType | MathAltType) => string;

// Fully pre-renders the LaTeX to KaTeX HTML server-side via `katexDisplay`/`katexInline`, so the
// result is self-contained, finished markup rather than source text for something else to interpret.
export const renderMathAsHtml = (
  options: KatexOptions = {},
  format: (code: string) => string = (code) => code,
): MathRenderer => {
  return (code, type) => {
    switch (type) {
      case "displayMathBlock":
      case "displayAltMathBlock":
        return `\n<p>${katexDisplay(format(code), options)}</p>\n`;
      case "displayMath":
      case "displayAltMath":
        return katexDisplay(format(code), options);
      case "inlineMath":
      case "inlineAltMath":
        return katexInline(format(code), options);
    }
  };
};
