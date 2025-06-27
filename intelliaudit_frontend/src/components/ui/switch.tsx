import React from "react";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      className={`inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-blue-500" : "bg-gray-200"
      } ${className}`}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        data-state={checked ? "checked" : "unchecked"}
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}; 