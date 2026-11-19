import { NavLink, useMatch } from "react-router-dom";
import { useFilter } from "./filter/useFilter.ts";
import { linkClassName, styleTextLight } from "./ui/styles.ts";
import styles from "./Header.module.css";

export function Header() {
  const { listPath } = useFilter();
  const isProblems = useMatch("/problems/*") != null;
  return (
    <nav className={styles.root}>
      <NavLink to={listPath} className={linkClassName(isProblems)}>
        Problems
      </NavLink>
      <span className={styleTextLight}> / </span>
      <NavLink to="/stats" className={({ isActive }) => linkClassName(isActive)}>
        Stats
      </NavLink>
      <span className={styleTextLight}> / </span>
      <NavLink to="/settings" className={({ isActive }) => linkClassName(isActive)}>
        Settings
      </NavLink>
    </nav>
  );
}
