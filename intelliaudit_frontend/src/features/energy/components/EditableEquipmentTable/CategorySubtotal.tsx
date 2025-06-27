import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { EquipmentItem } from '../../types';

interface CategorySubtotalProps {
  items: EquipmentItem[];
  categoryName: string;
}

export const CategorySubtotal: React.FC<CategorySubtotalProps> = ({ 
  items,
  categoryName
}) => {
  // Calculate total kWh for the category
  const calculateCategoryTotal = () => {
    if (!items) return 0;
    
    const total = items.reduce((sum, item) => {
      return sum + (item.annual_kwh || 0);
    }, 0);
    
    return Math.round(total);
  };

  const total = calculateCategoryTotal();

  return (
    <TableRow className="bg-muted/70 border-t border-muted-foreground/20">
      <TableCell colSpan={5} className="text-right font-medium">
        {categoryName} Subtotal:
      </TableCell>
      <TableCell className="font-bold text-yellow-400">
        {total.toLocaleString()} kWh
      </TableCell>
      <TableCell colSpan={3}></TableCell>
    </TableRow>
  );
};
