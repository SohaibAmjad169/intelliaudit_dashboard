import { FC, ReactNode } from 'react';

interface PhaseGridProps {
  children: ReactNode;
  className?: string;
}

export const PhaseGrid: FC<PhaseGridProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-1 rounded-xl bg-transparent border border-emerald-500/20 ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {children}
      </div>
    </div>
  );
};
