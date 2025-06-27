import React from "react";
import { LucideIcon } from "lucide-react";

interface StatBlockProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  description?: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({ label, value, unit, icon: Icon, description }) => {
  return (
    <div className="rounded-lg bg-card/50 border border-emerald-500/10 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase">
        <Icon className="h-4 w-4 text-emerald-500" />
        {label}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-base font-normal ml-1">{unit}</span>}
      </div>
      {description && (
        <div className="text-xs italic text-muted-foreground mt-0.5">{description}</div>
      )}
    </div>
  );
}; 