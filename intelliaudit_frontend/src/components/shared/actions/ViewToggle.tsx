// import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useTheme } from "@/hooks/useTheme";
import { ViewMode } from '@/types/common';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`
      inline-flex rounded-lg p-1
      ${isDarkMode 
        ? 'bg-dark-800 border border-dark-700' 
        : 'bg-gray-100 border border-gray-200'
      }
    `}>
      <button
        onClick={() => onChange(ViewMode.GRID)}
        className={`
          p-2 rounded-md transition-colors
          ${mode === ViewMode.GRID
            ? isDarkMode
              ? 'bg-dark-700 text-white'
              : 'bg-white text-gray-900 shadow-sm'
            : isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-dark-700'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm'
          }
        `}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange(ViewMode.LIST)}
        className={`
          p-2 rounded-md transition-colors
          ${mode === ViewMode.LIST
            ? isDarkMode
              ? 'bg-dark-700 text-white'
              : 'bg-white text-gray-900 shadow-sm'
            : isDarkMode
              ? 'text-gray-400 hover:text-white hover:bg-dark-700'
              : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm'
          }
        `}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}