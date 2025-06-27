import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { EquipmentItem } from '../../types';
import { getWattageAsNumber } from '@/features/energy/utils/equipment';

interface GrandTotalProps {
  equipment: EquipmentItem[];
  totalApartmentCount: number;
  isApartmentEquipment: (item: EquipmentItem) => boolean;
}

export const GrandTotal: React.FC<GrandTotalProps> = ({ 
  equipment,
  totalApartmentCount,
  isApartmentEquipment
}) => {
  // Calculate grand total using the same logic as EquipmentRow
  const calculateGrandTotal = () => {
    if (!equipment) return 0;
    
    const total = equipment.reduce((sum, item) => {
      const isApartment = isApartmentEquipment(item);
      const quantity = item.quantity || 1;
      let itemKwh = 0;
      
      if (item.annual_kwh) {
        // Use the annual kWh directly if available
        itemKwh = item.annual_kwh;
      } else if (getWattageAsNumber(item) > 0) {
        // For electrical equipment: W × hours × weeks ÷ 1000 = kWh
        const weeklyHours = isApartment ? 28 : 84;
        const wattage = getWattageAsNumber(item);
        itemKwh = (wattage * quantity * weeklyHours * 52) / 1000;
      } else if (item.capacity && item.equipment_type?.toLowerCase().includes('water heater')) {
        // For water heaters: Use a more accurate formula
        const gallons = parseFloat(item.capacity.toString()) || 0;
        if (gallons > 0) {
          // Daily energy use per apartment (kWh)
          const dailyUse = (60 * 8.33 * 70) / (3412 * 0.6);
          // Annual energy use (kWh)
          itemKwh = dailyUse * 365 * quantity;
        }
      } else if (item.capacity && item.equipment_type?.toLowerCase().includes('furnace')) {
        // For furnaces: kBtu/h is the heating capacity
        const kBtuPerHour = parseFloat(item.capacity.toString()) || 0;
        if (kBtuPerHour > 0) {
          // Convert kBtu/h to kW (1 kBtu/h = 0.293 kW)
          const kW = kBtuPerHour * 0.293;
          // Assume furnace runs ~1000 hours per year in heating season
          itemKwh = kW * 1000 * quantity;
        }
      } else if (item.capacity) {
        // Generic capacity-based calculation with a more reasonable factor
        const value = parseFloat(item.capacity.toString()) || 0;
        const weeklyHours = isApartment ? 28 : 84;
        if (value > 0) {
          itemKwh = value * quantity * weeklyHours * 0.1; // Using a more conservative factor
        }
      }
      
      // For apartment items, multiply by the number of apartments
      if (isApartment) {
        itemKwh *= totalApartmentCount;
      }
      
      return sum + itemKwh;
    }, 0);
    
    return Math.round(total);
  };

  const grandTotal = calculateGrandTotal();

  return (
    <TableRow className="bg-zinc-900 border-t-2 border-zinc-600 font-bold">
      <TableCell colSpan={7} className="text-right">
        Grand Total:
      </TableCell>
      <TableCell className="text-xl text-yellow-400">
        {grandTotal.toLocaleString()} kWh
      </TableCell>
    </TableRow>
  );
}; 