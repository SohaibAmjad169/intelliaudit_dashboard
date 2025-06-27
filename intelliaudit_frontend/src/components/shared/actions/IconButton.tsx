import React from 'react';
import { cn } from '@/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  size = 'medium',
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors',
        size === 'small' ? 'p-1' : size === 'medium' ? 'p-2' : 'p-3',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}; 