import { Toast } from "../toast/Toast.ts";
import { katexDisplay } from "./katex.ts";
import styles from "./CopiedPreview.module.css";

export async function copyToClipboard(tex: string) {
  try {
    await navigator.clipboard.writeText(tex);
    Toast.show({
      message: <CopiedPreview tex={tex} />,
      variant: "success",
    });
  } catch (error) {
    console.error("Failed to copy to the clipboard.", String(error));
    Toast.show({ message: "Could not copy to the clipboard.", variant: "error" });
  }
}
export function CopiedPreview({ tex }: { tex: string }) {
  return (
    <div className={styles.root}>
      <p>Copied to the clipboard.</p>
      <p dangerouslySetInnerHTML={{ __html: katexDisplay(tex, {}) }} />
    </div>
  );
}
