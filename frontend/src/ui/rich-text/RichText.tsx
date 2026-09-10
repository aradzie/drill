import { formatField } from "./format-field.ts";
import { renderMathAsHtml } from "./math-renderer.ts";

export function RichText({ text, className }: { text: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: formatField(text, renderMathAsHtml()) }} />;
}
