import React from "react";
import Link from "@docusaurus/Link";
import clsx from "clsx";

import "./Button.css";

const Button = ({
  children,
  to,
  href,
  onClick,
  variant = "contained",
  className,
  hasIcon,
}) => {
  const Component = to ? Link : href ? "a" : "button";

  return (
    <Component
      to={to}
      href={href}
      onClick={onClick}
      className={clsx("button", {
        [`button-${variant}`]: !!variant,
        [className]: !!className,
        "with-icon": !!hasIcon,
      })}
    >
      {children}
      {hasIcon && (
        <svg
          width="5"
          height="8"
          viewBox="0 0 5 8"
          fill="none"
          className="chevron-right"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.35355 3.51901C4.54882 3.71427 4.54882 4.03085 4.35355 4.22611L1.17157 7.40809C0.976311 7.60335 0.659728 7.60335 0.464466 7.40809C0.269204 7.21283 0.269204 6.89625 0.464466 6.70099L3.29289 3.87256L0.464466 1.04413C0.269204 0.848869 0.269204 0.532287 0.464466 0.337025C0.659728 0.141762 0.976311 0.141762 1.17157 0.337025L4.35355 3.51901ZM3 3.37256H4V4.37256H3V3.37256Z"
            fill="currentColor"
          />
        </svg>
      )}
    </Component>
  );
};

export default Button;
