import React from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ children, className, ...props }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <label
      className={cn(
        'block text-sm font-medium',
        isDarkMode ? 'text-gray-200' : 'text-gray-700',
        'mb-2',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};
