import React from 'react';
import { LucideIcon, LayoutGrid, Table2 } from 'lucide-react';
import { Button } from '@shared/actions/Button';
import { useTheme } from 'next-themes';
import { SearchInput } from '@components/forms/inputs/SearchInput';
import { Badge } from '@shared/data-display/Badge';
import { cn } from '@/utils';

type ViewMode = 'grid' | 'table';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    count: number;
    label: string;
  };
  icon: LucideIcon;
  actionButton?: {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    buttonClassName?: string;
  };
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  viewMode?: {
    mode: ViewMode;
    onChange: (mode: ViewMode) => void;
  };
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  icon: Icon,
  actionButton,
  search,
  viewMode,
  children,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <Icon
              className={`h-8 w-8 mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            />
            <div>
              <div className="flex items-center gap-3">
                <h1
                  className={`text-2xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {title}
                </h1>
                {badge && (
                  <Badge color="blue">
                    {badge.count} {badge.label}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <h2 className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </h2>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {viewMode && (
              <div className="flex border rounded-md">
                <button
                  onClick={() => viewMode.onChange('grid')}
                  className={cn(
                    "p-2 rounded-l-md transition-colors duration-150",
                    viewMode.mode === 'grid'
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => viewMode.onChange('table')}
                  className={cn(
                    "p-2 rounded-r-md transition-colors duration-150",
                    viewMode.mode === 'table'
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Table2 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {actionButton && (
              <Button
                variant="primary"
                onClick={actionButton.onClick}
                leftIcon={<actionButton.icon />}
                className={actionButton.buttonClassName}
              >
                {actionButton.label}
              </Button>
            )}
          </div>
        </div>

        {/* Search Row */}
        {search && (
          <div className="w-full max-w-md">
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder || 'Search...'}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Children Content */}
        {children}
      </div>
    </div>
  );
};
