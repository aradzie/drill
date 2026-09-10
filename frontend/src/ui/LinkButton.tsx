import { clsx } from "clsx";
import type { AriaAttributes, ReactNode, Ref } from "react";
import type { ClassName, DataProps, FocusProps, MouseProps } from "./props.ts";
import { linkClassName } from "./styles.ts";

function LinkButton({
  ref,
  children,
  className,
  active = false,
  disabled,
  tabIndex,
  title,
  onClick,
  ...props
}: {
  ref?: Ref<HTMLAnchorElement>;
  children: ReactNode;
  className?: ClassName;
  active?: boolean;
  title?: string;
} & FocusProps &
  MouseProps &
  AriaAttributes &
  DataProps) {
  return (
    <a
      ref={ref}
      href="#"
      className={clsx(linkClassName(active), className)}
      tabIndex={tabIndex}
      title={title}
      onClick={(event) => {
        event.preventDefault();
        if (onClick != null) {
          onClick(event);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}

export { LinkButton };
