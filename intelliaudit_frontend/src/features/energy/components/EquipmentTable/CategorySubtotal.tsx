import React, { useMemo } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { EquipmentItem } from '../../types';
import { getWattageAsNumber } from '@/features/energy/utils/equipment';

interface CategorySubtotalProps {
  category: string;
  items: EquipmentItem[];
  totalApartmentCount: number;
  isApartmentEquipment: (item: EquipmentItem) => boolean;
}

export const CategorySubtotal: React.FC<CategorySubtotalProps> = ({
  category,
  items,
  totalApartmentCount,
  isApartmentEquipment
}) => {
  // Calculate total annual kWh for this category
  const totalKwh = useMemo(() => {
    return items.reduce((sum, item) => {
      // If the backend has already calculated annual_kwh, use that value
      if (item.annual_kwh !== undefined && item.annual_kwh !== null) {
        return sum + item.annual_kwh;
      }
      
      // Otherwise, calculate it using the frontend logic
      const isApartment = isApartmentEquipment(item);
      const quantity = item.quantity || 1;
      let kwh = 0;
      
      if (item.wattage) {
        const weeklyHours = isApartment ? 28 : 84;
        const wattage = getWattageAsNumber(item);
        kwh = (wattage * quantity * weeklyHours * 52) / 1000;
      } else if (item.capacity) {
        const value = parseFloat(item.capacity.toString()) || 0;
        const weeklyHours = isApartment ? 28 : 84;
        if (value > 0) {
          kwh = value * quantity * weeklyHours * 0.1;
        }
      }
      
      if (isApartment) {
        kwh *= totalApartmentCount;
      }
      
      return sum + kwh;
    }, 0);
  }, [items, totalApartmentCount, isApartmentEquipment]);

  return (
    <TableRow className="border-t border-muted-foreground/20 bg-muted/30">
      <TableCell className="font-medium">{category} Total</TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell className="font-bold">
        {Math.round(totalKwh).toLocaleString()} kWh
      </TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
}; 