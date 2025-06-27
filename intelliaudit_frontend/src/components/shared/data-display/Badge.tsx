import React from 'react';
import { Badge as ShadcnBadge } from "../../../components/ui/badge";
import { cn } from '@/utils';

export type BadgeColor = 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | string;

export interface BadgeProps {
  children: React.ReactNode;
  color: BadgeColor;
  className?: string;
}

const getColorClasses = (color: BadgeColor): string => {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    red: 'bg-red-100 text-red-800 hover:bg-red-100',
    yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    green: 'bg-green-100 text-green-800 hover:bg-green-100',
    blue: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    indigo: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
    purple: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    pink: 'bg-pink-100 text-pink-800 hover:bg-pink-100',
  };

  return colorMap[color] || `bg-${color}-100 text-${color}-800 hover:bg-${color}-100`;
};

export const Badge: React.FC<BadgeProps> = ({ children, color, className = '' }) => {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        getColorClasses(color),
        className
      )}
    >
      {children}
    </ShadcnBadge>
  );
};
