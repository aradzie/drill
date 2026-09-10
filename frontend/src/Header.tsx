import { LinkButton } from "./ui/LinkButton.tsx";
import { styleTextLight } from "./ui/styles.ts";
import styles from "./Header.module.css";

type Screen = "problems" | "stats" | "settings";

export function Header({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className={styles.root}>
      <LinkButton active={active === "problems"} onClick={() => onNavigate("problems")}>
        Problems
      </LinkButton>
      <span className={styleTextLight}> / </span>
      <LinkButton active={active === "stats"} onClick={() => onNavigate("stats")}>
        Stats
      </LinkButton>
      <span className={styleTextLight}> / </span>
      <LinkButton active={active === "settings"} onClick={() => onNavigate("settings")}>
        Settings
      </LinkButton>
    </nav>
  );
}
