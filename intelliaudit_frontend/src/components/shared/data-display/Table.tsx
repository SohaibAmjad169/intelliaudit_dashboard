import React from 'react';
import {
  Table as ShadcnTable,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { cn } from '@/utils';

export interface Column<T> {
  header: React.ReactNode;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  caption,
  className,
  onRowClick,
  isLoading = false,
  emptyState,
}: TableProps<T>) {
  const renderCell = (item: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }
    
    const value = item[column.accessor as keyof T];
    return value as React.ReactNode;
  };

  return (
    <div className={cn("w-full overflow-auto", className)}>
      <ShadcnTable>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyState || "No data available"}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, rowIndex) => (
              <TableRow 
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={column.className}>
                    {renderCell(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </ShadcnTable>
    </div>
  );
} 