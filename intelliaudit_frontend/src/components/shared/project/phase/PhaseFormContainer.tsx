import { FC, ReactNode } from 'react';

interface PhaseFormContainerProps {
  children: ReactNode;
}

export const PhaseFormContainer: FC<PhaseFormContainerProps> = ({ children }) => {
  return (
    <div className="mt-8 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
      {children}
    </div>
  );
};
