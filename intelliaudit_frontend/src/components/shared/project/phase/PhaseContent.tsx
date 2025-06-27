import React from 'react';
import { useTheme } from "@/hooks/useTheme";

interface PhaseContentProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
}

export const PhaseContent: React.FC<PhaseContentProps> = ({
  children,
  sidebar,
  footer,
  loading = false
}) => {
  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className={`h-8 w-8 rounded-full ${isDarkMode ? 'bg-dark-700' : 'bg-gray-200'} mb-4`} />
          <div className={`h-4 w-24 rounded ${isDarkMode ? 'bg-dark-700' : 'bg-gray-200'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex">
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Optional Sidebar */}
        {sidebar && (
          <div className={`w-80 overflow-auto border-l ${isDarkMode ? 'border-dark-700' : 'border-gray-200'} p-4`}>
            {sidebar}
          </div>
        )}
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className={`
          mt-auto border-t ${isDarkMode ? 'border-dark-700' : 'border-gray-200'}
          px-6 py-4 bg-white dark:bg-dark-800
        `}>
          {footer}
        </div>
      )}
    </div>
  );
};
