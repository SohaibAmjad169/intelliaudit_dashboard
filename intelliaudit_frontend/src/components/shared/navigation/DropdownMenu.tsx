import React from 'react';
import {
  DropdownMenu as DropdownMenuPrimitive,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils';

export interface DropdownMenuItemProps {
  /** The label to display */
  label: string;
  /** The icon to display */
  icon?: React.ReactNode;
  /** The keyboard shortcut to display */
  shortcut?: string;
  /** The action to perform when clicked */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is destructive */
  destructive?: boolean;
  /** Additional class name for the item */
  className?: string;
}

export interface DropdownMenuGroupProps {
  /** The label for the group */
  label?: string;
  /** The items in the group */
  items: DropdownMenuItemProps[];
}

export interface DropdownMenuProps {
  /** The trigger element */
  trigger: React.ReactNode;
  /** The items or groups to display */
  items: (DropdownMenuItemProps | DropdownMenuGroupProps)[];
  /** Additional class name for the content */
  className?: string;
  /** The side to align the dropdown to */
  align?: 'start' | 'center' | 'end';
  /** The side to place the dropdown on */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

/**
 * DropdownMenu component for displaying a menu of options
 * 
 * @example
 * ```tsx
 * <DropdownMenu
 *   trigger={<Button>Open Menu</Button>}
 *   items={[
 *     { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => {} },
 *     { label: 'Delete', icon: <Trash className="h-4 w-4" />, destructive: true, onClick: () => {} },
 *   ]}
 * />
 * ```
 */
export function DropdownMenu({
  trigger,
  items,
  className,
  align = 'end',
  side = 'bottom',
}: DropdownMenuProps) {
  // Helper function to check if an item is a group
  const isGroup = (item: DropdownMenuItemProps | DropdownMenuGroupProps): item is DropdownMenuGroupProps => {
    return 'items' in item;
  };

  // Render a single menu item
  const renderMenuItem = (item: DropdownMenuItemProps, index: number) => (
    <DropdownMenuItem
      key={index}
      onClick={item.onClick}
      disabled={item.disabled || false}
      className={cn(
        item.destructive && 'text-destructive focus:text-destructive',
        item.className
      )}
    >
      {item.icon && <span className="mr-2">{item.icon}</span>}
      {item.label}
      {item.shortcut && (
        <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
      )}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenuPrimitive>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={cn('min-w-[12rem]', className)}
        align={align}
        side={side}
        sideOffset={5}
      >
        {items.map((item, index) => {
          // If it's a group, render a group with label
          if (isGroup(item)) {
            return (
              <React.Fragment key={index}>
                {index > 0 && <DropdownMenuSeparator />}
                {item.label && <DropdownMenuLabel>{item.label}</DropdownMenuLabel>}
                <DropdownMenuGroup>
                  {item.items.map((groupItem, groupIndex) => 
                    renderMenuItem(groupItem, groupIndex)
                  )}
                </DropdownMenuGroup>
              </React.Fragment>
            );
          }
          
          // Otherwise render a single item
          return renderMenuItem(item, index);
        })}
      </DropdownMenuContent>
    </DropdownMenuPrimitive>
  );
} 