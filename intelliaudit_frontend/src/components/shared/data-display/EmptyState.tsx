import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface EmptyStateProps {
  icon: LucideIcon | React.ReactElement;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`
      flex flex-col items-center justify-center
      ${compact ? 'py-6 px-3' : 'py-12 px-4'}
      ${className}
    `}>
      <div className={`
        p-3 rounded-full mb-4
        ${isDarkMode ? 'bg-[#212226]' : 'bg-light-100'}
      `}>
        {React.isValidElement(icon) ? icon : (
          // If it's a LucideIcon component
          React.createElement(icon as LucideIcon, {
            className: `w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`
          })
        )}
      </div>
      <h3 className={`
        ${compact ? 'text-base' : 'text-lg'} font-medium mb-1 text-center
        ${isDarkMode ? 'text-light-50' : 'text-dark-900'}
      `}>
        {title}
      </h3>
      <p className={`
        ${compact ? 'text-xs' : 'text-sm'} text-center mb-4
        ${isDarkMode ? 'text-light-400' : 'text-dark-500'}
      `}>
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
