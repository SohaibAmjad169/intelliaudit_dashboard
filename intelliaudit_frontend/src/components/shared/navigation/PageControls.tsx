import React, { useState } from 'react';
import { Button } from '@shared/actions/Button';
import { SearchInput } from '@components/forms/inputs/SearchInput';

type ViewMode = 'grid' | 'table';

export interface PageControlsProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  showViewMode?: boolean;
  searchPlaceholder?: string;
  isDarkMode?: boolean;
  onAdd?: () => void;
  addButtonText?: string;
}

export const PageControls: React.FC<PageControlsProps> = ({
  onSearch,
  onViewModeChange,
  viewMode = 'grid',
  showSearch,
  showViewMode,
  onAdd,
  addButtonText = 'Add New',
  searchPlaceholder = 'Search...',
  isDarkMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      <div className="w-full sm:w-auto">
        {showSearch && onSearch && (
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearch}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
      <div className="flex items-center gap-4">
        {showViewMode && onViewModeChange && (
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('table')}
            >
              Table
            </Button>
          </div>
        )}
        {onAdd && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAdd}
          >
            {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
};
