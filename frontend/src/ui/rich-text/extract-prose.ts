import { decodeHTML } from "entities";
import { Parser } from "htmlparser2";
import { Marked, type Token, type Tokens } from "marked";
import { mathExtension } from "./marked-math.ts";

// Only lexing runs here; search never renders formulas through KaTeX.
const markdown = new Marked().use(mathExtension(() => " "));

const blockTags = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "caption",
  "dd",
  "details",
  "dialog",
  "div",
  "dl",
  "dt",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "hr",
  "legend",
  "li",
  "main",
  "menu",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "summary",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

function escapeText(text: string): string {
  return text //
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Preserve raw HTML across token boundaries so inline tags, comments, and script/style
// contents are handled by one structured parser. All Markdown text is protected from
// being interpreted as HTML, with entities decoded exactly once (never inside code).
function fragment(tokens: readonly Token[]): string {
  return tokens
    .map((token): string => {
      switch (token.type) {
        case "displayMathBlock":
        case "displayMath":
        case "inlineMath":
        case "displayAltMathBlock":
        case "displayAltMath":
        case "inlineAltMath":
        case "space":
        case "hr":
        case "br":
          return " ";
        case "html":
          return token.text;
        case "code":
          return ` ${escapeText(token.text)} `;
        case "codespan":
        case "escape":
          return escapeText(token.text);
        case "list":
          return ` ${(token as Tokens.List).items.map((item) => fragment(item.tokens)).join(" ")} `;
        case "table":
          return ` ${[(token as Tokens.Table).header, ...(token as Tokens.Table).rows]
            .map((row) => row.map((cell) => fragment(cell.tokens)).join(" "))
            .join(" ")} `;
        case "heading":
        case "paragraph":
        case "blockquote":
          return ` ${fragment(token.tokens ?? [])} `;
        default:
          if ("tokens" in token && token.tokens) {
            return fragment(token.tokens);
          }
          // Marked marks text inside raw HTML elements as already escaped.
          if (token.type === "text" && token.escaped) {
            return token.text;
          }
          return escapeText(decodeHTML("text" in token ? token.text : ""));
      }
    })
    .join("");
}

export function extractProse(value: string): string {
  const parts: string[] = [];
  let hiddenDepth = 0;
  const parser = new Parser({
    onopentag(name) {
      if (name === "script" || name === "style") {
        hiddenDepth += 1;
      }
      if (blockTags.has(name) && hiddenDepth === 0) {
        parts.push(" ");
      }
    },
    ontext(text) {
      if (hiddenDepth === 0) {
        parts.push(text);
      }
    },
    onclosetag(name) {
      if (name === "script" || name === "style") {
        hiddenDepth -= 1;
      }
      if (blockTags.has(name) && hiddenDepth === 0) {
        parts.push(" ");
      }
    },
  });
  parser.end(fragment(markdown.lexer(value.trim())));
  return parts.join("");
}
