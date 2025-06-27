import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { EntityActionMenu } from '@shared/actions/EntityActionMenu';
import { LucideIcon } from 'lucide-react';

interface BaseCardProps {
  title: string;
  titleClassName?: string;
  icon?: LucideIcon | null;
  iconColor?: string;
  onEdit?: (() => void) | undefined;
  onDelete?: ((e: React.MouseEvent) => void) | undefined;
  onClick?: (() => void) | undefined;
  isDeleting?: boolean | undefined;
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  titleClassName = '',
  icon: Icon,
  iconColor = 'text-primary-500',
  onEdit,
  onDelete,
  onClick,
  isDeleting,
  children,
  headerContent,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger the onClick if we're clicking the menu
    if ((e.target as HTMLElement).closest('.action-menu')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.();
  };

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 border ${
        isDarkMode ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800' : 'border-gray-100 bg-white hover:bg-gray-50'
      } ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        className={`p-6 ${onClick ? 'cursor-pointer' : ''} ${
          isDarkMode ? 'text-gray-200 dark:text-gray-200' : 'text-gray-900'
        }`}
        onClick={handleCardClick}
      >
        <div className="grid grid-cols-[1fr,auto] items-center gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50 dark:bg-gray-700/50' : 'bg-gray-50'} ring-1 ring-inset ${
                isDarkMode ? 'ring-gray-700 dark:ring-gray-700' : 'ring-gray-200'
              }`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
            )}
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white dark:text-white' : 'text-gray-900'} ${titleClassName} min-w-0`}>
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-4">
            {headerContent}
            {(onEdit || onDelete) && (
              <div className="relative">
                <EntityActionMenu
                  onEdit={onEdit || undefined}
                  onDelete={(e) => {
                    if (onDelete) onDelete(e);
                  }}
                  isDeleting={isDeleting || false}
                  position="bottom-end"
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
};
