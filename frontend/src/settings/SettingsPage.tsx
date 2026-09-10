import { Page } from "../Page.tsx";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  return (
    <Page>
      <div className={styles.header}>Scheduling</div>
      <div className={styles.section}>☑ Schedule easy problems.</div>

      <div className={styles.header}>Appearance</div>
      <div className={styles.section}>Colors / Fonts</div>
    </Page>
  );
}
