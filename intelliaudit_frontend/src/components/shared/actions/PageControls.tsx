import { Search, Grid, List } from 'lucide-react';
import { useTheme } from "@/hooks/useTheme";
import { Button } from './Button';

interface PageControlsProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  showSearch?: boolean;
  showViewMode?: boolean;
}

export default function PageControls({
  searchQuery = '',
  onSearchChange,
  viewMode,
  onViewModeChange,
  showSearch = true,
  showViewMode = true,
}: PageControlsProps) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search..."
              className={`
                block w-full pl-10 pr-3 py-2 border rounded-md leading-5 
                ${isDarkMode 
                  ? 'bg-dark-800 border-dark-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              `}
            />
          </div>
        )}

        {showViewMode && (
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              onClick={() => onViewModeChange('grid')}
              size="sm"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              onClick={() => onViewModeChange('table')}
              size="sm"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
