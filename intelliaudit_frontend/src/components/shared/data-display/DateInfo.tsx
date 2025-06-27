import React from 'react';
import { formatDate } from '@/utils/date';

export interface DateInfoProps {
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  className?: string;
}

export const DateInfo: React.FC<DateInfoProps> = ({
  createdAt,
  updatedAt,
  className = '',
}) => {
  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      {createdAt && (
        <div>
          Created: {formatDate(createdAt)}
        </div>
      )}
      {updatedAt && (
        <div>
          Updated: {formatDate(updatedAt)}
        </div>
      )}
    </div>
  );
};
