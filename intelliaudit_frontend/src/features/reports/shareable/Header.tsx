import React from 'react';
import { Share2, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  onDownloadPdf?: () => void;
  projectName?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  isDarkMode, 
  setIsDarkMode, 
  projectName 
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <img 
            src="https://testwebsite.bravuratechnologies.com/wp-content/uploads/2023/07/ASHRAE-Logo.webp" 
            alt="ASHRAE Logo" 
            className="h-10 mr-4" 
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Energy Audit Report
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {projectName ? projectName : 'ASHRAE Level II Analysis'} • Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500 hidden sm:inline">Shareable Report</span>
          </div>
        </div>
      </div>
    </header>
  );
}; 