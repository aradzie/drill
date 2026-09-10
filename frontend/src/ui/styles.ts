import { clsx } from "clsx";
import styles from "./styles.module.css";

export const styleMarginTrim = styles.marginTrim;
export const styleTextLight = styles.textLight;
export const styleTextBold = styles.textBold;
export const styleTextItalic = styles.textItalic;
export const styleTextCenter = styles.textCenter;
export const styleTextStart = styles.textStart;
export const styleTextEnd = styles.textEnd;
export const styleTextNoWrap = styles.textNoWrap;
export const styleTextTruncate = styles.textTruncate;

export const linkClassName = (active: boolean): string => {
  return clsx(styles.link, active && styles.activeLink);
};
