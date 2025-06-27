import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, icon: Icon, children }) => {
  return (
    <section className="rounded-lg border border-emerald-500/10 bg-card/50 p-6 space-y-4">
      <header className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-emerald-500" />
        <h2 className="text-lg font-medium">{title}</h2>
      </header>
      {children}
    </section>
  );
}; 