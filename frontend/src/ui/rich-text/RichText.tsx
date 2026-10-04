import { mdiContentCopy } from "@mdi/js";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { IconButton } from "../IconButton.tsx";
import { Toast } from "../toast/Toast.ts";
import { formatField } from "./format-field.ts";
import { renderMathAsHtml } from "./math-renderer.ts";
import { themeSvgImages } from "./theme-svg-images.ts";
import styles from "./RichText.module.css";

export function RichText({
  className,
  text,
  align = "start",
  copyable = false,
}: {
  className?: string;
  text: string;
  align?: "start" | "center";
  copyable?: boolean;
}) {
  const html = formatField(text, renderMathAsHtml());
  const [themed, setThemed] = useState<{ source: string; html: string } | null>(null);

  useEffect(() => {
    let current = true;
    void themeSvgImages(html)
      .then((result) => {
        if (current) setThemed({ source: html, html: result });
      })
      .catch((error: unknown) => {
        console.error("Could not theme SVG images.", error);
      });
    return () => {
      current = false;
    };
  }, [html]);

  return (
    <div className={styles.root}>
      <div
        className={clsx(
          styles.body,
          {
            [styles.alignStart]: align === "start",
            [styles.alignCenter]: align === "center",
          },
          className,
        )}
        dangerouslySetInnerHTML={{ __html: themed?.source === html ? themed.html : html }}
      />
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
