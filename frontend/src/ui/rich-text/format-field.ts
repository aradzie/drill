import { Marked, type Token } from "marked";
import { mathExtension } from "./marked-math.ts";
import type { MathRenderer } from "./math-renderer.ts";

const mathTypes = new Set([
  "displayMathBlock",
  "displayMath",
  "inlineMath",
  "displayAltMathBlock",
  "displayAltMath",
  "inlineAltMath",
]);

function keepImageAltText(tokens: Token[]): void {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    if (mathTypes.has(token.type)) {
      tokens[i] = { type: "text", raw: token.raw, text: token.raw };
    } else if ("tokens" in token && token.tokens) {
      keepImageAltText(token.tokens);
    }
  }
}

export function formatField(value: string, math: MathRenderer): string {
  return new Marked()
    .use(mathExtension(math), {
      walkTokens(token) {
        if (token.type === "image" && token.tokens) {
          keepImageAltText(token.tokens);
        }
      },
    })
    .parse(value.trim(), { async: false })
    .trim();
}
