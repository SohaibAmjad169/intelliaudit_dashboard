"use client"

import React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  htmlFor?: string;
  className?: string;
};

export const Label: React.FC<LabelProps> = ({
  children,
  htmlFor,
  className = "",
  ...props
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}; 