import { mdiContentCopy } from "@mdi/js";
import { IconButton } from "../IconButton.tsx";
import { Toast } from "../toast/Toast.ts";
import { formatField } from "./format-field.ts";
import { renderMathAsHtml } from "./math-renderer.ts";
import styles from "./RichText.module.css";

export function RichText({ text, className, copyable }: { text: string; className?: string; copyable?: boolean }) {
  return (
    <div className={styles.root}>
      <div className={className} dangerouslySetInnerHTML={{ __html: formatField(text, renderMathAsHtml()) }} />
      {copyable && (
        <div className={styles.tools}>
          <IconButton
            variant="ghost"
            icon={mdiContentCopy}
            title="Copy to clipboard"
            onClick={() => void copyContent(text)}
          />
        </div>
      )}
    </div>
  );
}

async function copyContent(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    Toast.show({ message: "Copied to the clipboard.", variant: "success" });
  } catch (error) {
    console.error("Failed to copy to the clipboard.", String(error));
    Toast.show({ message: "Could not copy to the clipboard.", variant: "error" });
  }
}
