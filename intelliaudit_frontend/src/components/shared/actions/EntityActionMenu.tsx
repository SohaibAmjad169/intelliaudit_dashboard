import React from 'react';
import { MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils';

interface EntityActionMenuProps {
  onEdit?: (() => void) | undefined;
  onDelete: (e: React.MouseEvent) => void;
  isDeleting: boolean;
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

export function EntityActionMenu({
  onEdit,
  onDelete,
  isDeleting = false,
  position = 'bottom-end'
}: EntityActionMenuProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Convert position to align and side
  const getPositionProps = () => {
    const [side, align] = position.split('-');
    return { side, align };
  };

  const { side, align } = getPositionProps();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cn(
          "p-2 rounded-lg transition-colors duration-200",
          isDarkMode
            ? "hover:bg-dark-600 text-light-300 dark:hover:bg-dark-600 dark:text-light-300"
            : "hover:bg-light-100 text-dark-500"
        )}
      >
        <MoreVertical className="w-5 h-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side as "top" | "bottom"}
        align={align as "start" | "end"}
        className="w-48"
      >
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit();
              }
            }}
            className={cn(
              "cursor-pointer",
              isDarkMode ? "text-gray-300 hover:bg-dark-600 dark:text-gray-300 dark:hover:bg-dark-600" : "text-gray-700"
            )}
          >
            <Pencil className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(e) => {
            handleClick(e);
            onDelete(e);
          }}
          disabled={isDeleting}
          className={cn(
            "cursor-pointer",
            isDarkMode ? "text-red-400 dark:text-red-400" : "text-red-600",
            isDeleting && "opacity-70 pointer-events-none"
          )}
        >
          {isDeleting ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="mr-3 h-5 w-5" aria-hidden="true" />
          )}
          {isDeleting ? 'Deleting...' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
