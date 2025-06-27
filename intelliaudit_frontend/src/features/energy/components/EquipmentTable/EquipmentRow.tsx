import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash, Info } from 'lucide-react';
import { EquipmentItem, Location } from '../../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getWattageAsNumber } from '@/features/energy/utils/equipment';

interface EquipmentRowProps {
  item: EquipmentItem;
  onEdit?: (id: string | number) => void;
  onDelete?: (id: string | number) => void;
  totalApartmentCount: number;
  isApartmentEquipment: (item: EquipmentItem) => boolean;
}

export const EquipmentRow: React.FC<EquipmentRowProps> = ({
  item,
  onEdit,
  onDelete,
  totalApartmentCount,
  isApartmentEquipment
}) => {
  const [showCalculationDialog, setShowCalculationDialog] = useState(false);

  const formatLocation = (location?: string | Location): string => {
    if (!location) return 'N/A';
    
    if (typeof location === 'string') {
      // Extract numbers from the location string
      const match = location.match(/\d+/);
      if (match) {
        return match[0];
      }
      return location;
    } else {
      // Handle Location object
      return location.room || location.area || 'N/A';
    }
  };

  // Format wattage
  const formatWattage = (): string => {
    // First check direct wattage values
    const directWattage = item.specifications?.wattage || item.wattage || item.details?.wattage;
    
    // If direct wattage is available and not zero, use it
    if (directWattage && directWattage > 0) {
      return `${directWattage.toLocaleString()} W`;
    }
    
    // Otherwise, try to calculate from capacity based on equipment type
    if (item.capacity) {
      const capacityValue = parseFloat(item.capacity.toString());
      if (!isNaN(capacityValue) && capacityValue > 0) {
        const equipmentType = (item.equipment_type || item.type || item.category || '').toLowerCase();
        let estimatedWattage = 0;
        let unit = 'W';
        
        // Check for capacity unit if available
        const capacityUnit = (item.capacity_unit || '').toLowerCase();
        const isBtu = capacityUnit.includes('btu') || equipmentType.includes('furnace') || 
                     equipmentType.includes('boiler') || equipmentType.includes('hvac');
        const isGallon = capacityUnit.includes('gal') || equipmentType.includes('water');
        const isTon = capacityUnit.includes('ton') || (capacityValue < 100 && equipmentType.includes('cool'));
        
        // Convert based on equipment type and capacity unit
        if (isGallon) {
          // For water heaters: ~4500W per 40-50 gallons for electric
          estimatedWattage = (capacityValue / 45) * 4500;
          unit = 'W (from gal)';
        } else if (isTon) {
          // For cooling equipment: 1 ton = 12,000 BTU/hr = ~3,516W
          estimatedWattage = capacityValue * 3516;
          unit = 'W (from tons)';
        } else if (isBtu) {
          // For heating equipment: 1 BTU/hr = 0.293W
          estimatedWattage = capacityValue * 0.293;
          unit = 'W (from BTU/h)';
        } else if (equipmentType.includes('light') || equipmentType.includes('lamp') || equipmentType.includes('fixture')) {
          // For lighting, capacity might be in lumens
          // Rough estimate: 1 lumen ≈ 0.1W for LED, 0.2W for CFL, 0.6W for incandescent
          estimatedWattage = capacityValue * 0.2; // Using middle value as default
          unit = 'W (from lumens)';
        } else {
          // Generic approximation
          estimatedWattage = capacityValue;
          unit = 'W (est)';
        }
        
        if (estimatedWattage > 0) {
          return `${Math.round(estimatedWattage).toLocaleString()} ${unit}`;
        }
      }
    }
    
    // If we have annual_kwh but no wattage, try to estimate
    if (item.annual_kwh && (item.operating_hours || item.weekly_hours)) {
      const hours = item.operating_hours || item.weekly_hours || 0;
      if (hours > 0) {
        // Reverse calculate: kWh * 1000 / (hours * 52 * quantity)
        const quantity = item.quantity || 1;
        const estimatedWattage = (item.annual_kwh * 1000) / (hours * 52 * quantity);
        return `${Math.round(estimatedWattage).toLocaleString()} W (est)`;
      }
    }
    
    // If equipment type is known, suggest typical wattage
    const equipmentType = (item.equipment_type || item.type || item.category || '').toLowerCase();
    if (equipmentType) {
      // Common equipment type wattages
      if (equipmentType.includes('refrigerator')) return '150 W (typ)';
      if (equipmentType.includes('dishwasher')) return '1800 W (typ)';
      if (equipmentType.includes('microwave')) return '1000 W (typ)';
      if (equipmentType.includes('washer')) return '500 W (typ)';
      if (equipmentType.includes('dryer') && !equipmentType.includes('hair')) return '3000 W (typ)';
      if (equipmentType.includes('tv')) return '120 W (typ)';
      if (equipmentType.includes('light bulb')) return '60 W (typ)';
      if (equipmentType.includes('ceiling fan')) return '75 W (typ)';
      if (equipmentType.includes('water heater') && equipmentType.includes('electric')) return '4500 W (typ)';
    }
    
    return 'N/A';
  };

  // Format operating hours
  const formatOperatingHours = (item: EquipmentItem): string => {
    if (item.annual_kwh && (item.operating_hours || item.weekly_hours)) {
      const hours = item.operating_hours || item.weekly_hours || 0;
      return `${hours} hrs/week`;
    }

    if (item.annual_hours) {
      const weeklyHours = Math.round((item.annual_hours / 52) * 10) / 10;
      return `${weeklyHours} hrs/week`;
    }

    const hours = item.weekly_hours ||
      item.specifications?.weeklyHours ||
      item.operating_hours ||
      0;

    if (hours) {
      return `${hours} hrs/week`;
    }

    if (item.annual_kwh && item.wattage && item.quantity) {
      const annualKwh = item.annual_kwh;
      const wattage = item.wattage;
      const quantity = item.quantity;
      const wattageNum = getWattageAsNumber(item);
      const estimatedWeeklyHours = Math.round((annualKwh * 1000) / (wattageNum * 52 * quantity) * 10) / 10;
      return `${estimatedWeeklyHours} hrs/week (est)`;
    }

    return '-';
  };

  // Get annual energy in kWh
  const getAnnualKwh = (): number => {
    // If the backend has already calculated annual_kwh, use that value
    if (item.annual_kwh !== undefined && item.annual_kwh !== null) {
      return typeof item.annual_kwh === 'string' ? parseFloat(item.annual_kwh) : item.annual_kwh;
    }
    
    // Otherwise, calculate it using the frontend logic
    const isApartment = isApartmentEquipment(item);
    const quantity = item.quantity || 1;
    let kwh = 0;
    
    // Try to estimate wattage if not directly available
    const getEstimatedWattage = (): number => {
      // First check direct wattage values
      const directWattage = item.specifications?.wattage || item.wattage || item.details?.wattage;
      if (directWattage && directWattage > 0) {
        return directWattage;
      }
      
      // Otherwise, try to calculate from capacity
      if (item.capacity) {
        const capacityValue = parseFloat(item.capacity.toString());
        if (!isNaN(capacityValue) && capacityValue > 0) {
          const equipmentType = (item.equipment_type || item.type || item.category || '').toLowerCase();
          
          // Check for capacity unit if available
          const capacityUnit = (item.capacity_unit || '').toLowerCase();
          const isBtu = capacityUnit.includes('btu') || equipmentType.includes('furnace') || 
                        equipmentType.includes('boiler') || equipmentType.includes('hvac');
          const isGallon = capacityUnit.includes('gal') || equipmentType.includes('water');
          const isTon = capacityUnit.includes('ton') || (capacityValue < 100 && equipmentType.includes('cool'));
          
          // Convert based on equipment type and capacity unit
          if (isGallon) {
            // For water heaters: ~4500W per 40-50 gallons for electric
            return (capacityValue / 45) * 4500;
          } else if (isTon) {
            // For cooling equipment: 1 ton = 12,000 BTU/hr = ~3,516W
            return capacityValue * 3516;
          } else if (isBtu) {
            // For heating equipment: 1 BTU/hr = 0.293W
            return capacityValue * 0.293;
          } else if (equipmentType.includes('light')) {
            // For lighting, capacity might be in lumens
            return capacityValue * 0.2; // Using middle value as default
          } else {
            // Generic approximation
            return capacityValue;
          }
        }
      }
      
      // Fallback to equipment type-based typical values
      const equipmentType = (item.equipment_type || item.type || item.category || '').toLowerCase();
      if (equipmentType) {
        if (equipmentType.includes('refrigerator')) return 150;
        if (equipmentType.includes('dishwasher')) return 1800;
        if (equipmentType.includes('microwave')) return 1000;
        if (equipmentType.includes('washer')) return 500;
        if (equipmentType.includes('dryer')) return 3000;
        if (equipmentType.includes('tv')) return 120;
        if (equipmentType.includes('light')) return 60;
        if (equipmentType.includes('fan')) return 75;
        if (equipmentType.includes('water heater')) return 4500;
      }
      
      return 0; // Return 0 if no estimation possible
    };
    
    // Get estimated wattage
    const estimatedWattage = getEstimatedWattage();
    
    if (estimatedWattage > 0) {
      // For electrical equipment: W × hours × weeks ÷ 1000 = kWh
      const weeklyHours = item.operating_hours || item.weekly_hours || (isApartment ? 28 : 84);
      kwh = (estimatedWattage * quantity * weeklyHours * 52) / 1000;
    } else if (item.capacity && item.equipment_type?.toLowerCase().includes('water heater')) {
      // For water heaters: Use a more accurate formula
      const gallons = parseFloat(item.capacity.toString()) || 0;
      if (gallons > 0) {
        // Daily energy use per apartment (kWh)
        const dailyUse = (60 * 8.33 * 70) / (3412 * 0.6);
        // Annual energy use (kWh)
        kwh = dailyUse * 365 * quantity;
      }
    } else if (item.capacity && item.equipment_type?.toLowerCase().includes('furnace')) {
      // For furnaces: kBtu/h is the heating capacity
      const kBtuPerHour = parseFloat(item.capacity.toString()) || 0;
      if (kBtuPerHour > 0) {
        // Convert kBtu/h to kW (1 kBtu/h = 0.293 kW)
        const kW = kBtuPerHour * 0.293;
        // Assume furnace runs ~1000 hours per year in heating season
        kwh = kW * 1000 * quantity;
      }
    } else if (item.capacity) {
      // Generic capacity-based calculation with a reasonable factor
      const value = parseFloat(item.capacity.toString()) || 0;
      const weeklyHours = isApartment ? 28 : 84;
      if (value > 0) {
        kwh = value * quantity * weeklyHours * 0.1; // Using a conservative factor
      }
    }
    
    // For apartment items, multiply by the number of apartments
    if (isApartment) {
      kwh *= totalApartmentCount;
    }
    
    return kwh;
  };

  // Get calculation details for the tooltip and dialog
  const getCalculationDetails = () => {
    const isApartment = isApartmentEquipment(item);
    const quantity = item.quantity || 1;
    const equipmentType = (item.equipment_type || item.type || item.category || '').toLowerCase();
    
    // Get estimated wattage and how it was determined
    let wattageSource = 'direct measurement';
    let wattageValue: number = item.wattage || item.specifications?.wattage || item.details?.wattage || 0;
    
    if (!wattageValue || wattageValue === 0) {
      if (item.capacity) {
        const capacityValue = parseFloat(item.capacity.toString());
        if (!isNaN(capacityValue) && capacityValue > 0) {
          const capacityUnit = (item.capacity_unit || '').toLowerCase();
          const isBtu = capacityUnit.includes('btu') || equipmentType.includes('furnace') || 
                       equipmentType.includes('boiler') || equipmentType.includes('hvac');
          const isGallon = capacityUnit.includes('gal') || equipmentType.includes('water');
          const isTon = capacityUnit.includes('ton') || (capacityValue < 100 && equipmentType.includes('cool'));
          
          if (isGallon) {
            wattageValue = (capacityValue / 45) * 4500;
            wattageSource = `calculated from ${capacityValue} gallons`;
          } else if (isTon) {
            wattageValue = capacityValue * 3516;
            wattageSource = `calculated from ${capacityValue} tons`;
          } else if (isBtu) {
            wattageValue = capacityValue * 0.293;
            wattageSource = `calculated from ${capacityValue} BTU/h`;
          } else if (equipmentType.includes('light')) {
            wattageValue = capacityValue * 0.2;
            wattageSource = `estimated from ${capacityValue} lumens`;
          } else {
            wattageValue = capacityValue;
            wattageSource = `estimated from capacity ${capacityValue}`;
          }
        }
      } else {
        // Typical values based on equipment type
        if (equipmentType.includes('refrigerator')) {
          wattageValue = 150;
          wattageSource = 'typical value for refrigerator';
        } else if (equipmentType.includes('dishwasher')) {
          wattageValue = 1800;
          wattageSource = 'typical value for dishwasher';
        } else if (equipmentType.includes('microwave')) {
          wattageValue = 1000;
          wattageSource = 'typical value for microwave';
        } else if (equipmentType.includes('washer')) {
          wattageValue = 500;
          wattageSource = 'typical value for washer';
        } else if (equipmentType.includes('dryer')) {
          wattageValue = 3000;
          wattageSource = 'typical value for dryer';
        } else if (equipmentType.includes('water heater')) {
          wattageValue = 4500;
          wattageSource = 'typical value for water heater';
        } else if (equipmentType.includes('light')) {
          wattageValue = 60;
          wattageSource = 'typical value for lighting';
        }
      }
    }
    
    // Get operating hours and how they were determined
    let hoursSource = 'direct measurement';
    let hoursValue = item.operating_hours || item.weekly_hours || item.specifications?.weeklyHours;
    
    if (!hoursValue || hoursValue === 0) {
      if (equipmentType.includes('water heater') || equipmentType.includes('boiler')) {
        hoursValue = 168;
        hoursSource = 'typical value (24/7 operation)';
      } else if (isApartment && (equipmentType.includes('heat') || equipmentType.includes('hvac'))) {
        hoursValue = 28;
        hoursSource = 'typical value for apartment HVAC';
      } else if (equipmentType.includes('light') && !isApartment) {
        hoursValue = 84;
        hoursSource = 'typical value for common area lighting';
      } else {
        hoursValue = isApartment ? 28 : 84;
        hoursSource = `typical value for ${isApartment ? 'apartment' : 'common area'} equipment`;
      }
    }
    
    // Calculation formula and result
    let formula = '';
    let steps: string[] = [];
    let result = 0;
    
    if (item.annual_kwh !== undefined && item.annual_kwh !== null) {
      result = item.annual_kwh;
      formula = 'Pre-calculated value from database';
      steps = [`Annual energy: ${result.toLocaleString()} kWh`];
    } else if (wattageValue > 0) {
      // Standard formula: Wattage * Hours * Weeks / 1000 * Quantity
      const weeksPerYear = 52;
      const baseCalc = (wattageValue * hoursValue * weeksPerYear) / 1000;
      const quantityCalc = baseCalc * quantity;
      result = isApartment ? quantityCalc * totalApartmentCount : quantityCalc;
      
      formula = 'Wattage × Hours × Weeks ÷ 1000 × Quantity' + (isApartment ? ' × Apartment Count' : '');
      steps = [
        `Wattage: ${wattageValue.toLocaleString()} W (${wattageSource})`,
        `Weekly hours: ${hoursValue} (${hoursSource})`,
        `Weeks per year: ${weeksPerYear}`,
        `Base calculation: ${wattageValue} × ${hoursValue} × ${weeksPerYear} ÷ 1000 = ${baseCalc.toLocaleString()} kWh per unit`,
        `Quantity: ${quantity}`,
        `Quantity adjustment: ${baseCalc.toLocaleString()} × ${quantity} = ${quantityCalc.toLocaleString()} kWh`
      ];
      
      if (isApartment) {
        steps.push(`Apartment count: ${totalApartmentCount}`);
        steps.push(`Building total: ${quantityCalc.toLocaleString()} × ${totalApartmentCount} = ${result.toLocaleString()} kWh`);
      } else {
        steps.push(`Final result: ${result.toLocaleString()} kWh`);
      }
    } else if (equipmentType.includes('water heater') && item.capacity) {
      // Special water heater formula
      const gallons = parseFloat(item.capacity.toString()) || 0;
      if (gallons > 0) {
        const dailyUse = (60 * 8.33 * 70) / (3412 * 0.6);
        const annualPerUnit = dailyUse * 365;
        const quantityCalc = annualPerUnit * quantity;
        result = isApartment ? quantityCalc * totalApartmentCount : quantityCalc;
        
        formula = 'Water Heater Formula: Daily kWh × 365 × Quantity' + (isApartment ? ' × Apartment Count' : '');
        steps = [
          `Capacity: ${gallons} gallons`,
          `Daily energy use: ${dailyUse.toFixed(2)} kWh (based on typical hot water usage)`,
          `Annual energy per unit: ${dailyUse.toFixed(2)} × 365 = ${annualPerUnit.toFixed(2)} kWh`,
          `Quantity: ${quantity}`,
          `Quantity adjustment: ${annualPerUnit.toFixed(2)} × ${quantity} = ${quantityCalc.toLocaleString()} kWh`
        ];
        
        if (isApartment) {
          steps.push(`Apartment count: ${totalApartmentCount}`);
          steps.push(`Building total: ${quantityCalc.toLocaleString()} × ${totalApartmentCount} = ${result.toLocaleString()} kWh`);
        } else {
          steps.push(`Final result: ${result.toLocaleString()} kWh`);
        }
      }
    }
    
    return {
      formula,
      steps,
      result: Math.round(result)
    };
  };
  
  const calculationDetails = getCalculationDetails();
  const annualKwh = getAnnualKwh();

  return (
    <TableRow className="border-0 hover:bg-muted/50">
      <TableCell>{item.equipment_type || item.type || item.category || 'Unknown'}</TableCell>
      <TableCell>{formatLocation(item.location)}</TableCell>
      <TableCell>{item.quantity || 1}</TableCell>
      <TableCell>{formatWattage()}</TableCell>
      <TableCell>{formatOperatingHours(item)}</TableCell>
      <TableCell className="font-semibold">
        <div className="flex items-center gap-1">
          {Math.round(annualKwh).toLocaleString()} kWh
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-1"
                  onClick={() => setShowCalculationDialog(true)}
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to view calculation details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Dialog open={showCalculationDialog} onOpenChange={setShowCalculationDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Energy Calculation Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold">Equipment</h4>
                <p className="text-sm text-muted-foreground">
                  {item.equipment_type || item.type || item.category || 'Unknown'} 
                  {item.make || item.manufacturer ? ` - ${item.make || item.manufacturer}` : ''}
                  {item.model ? ` ${item.model}` : ''}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">Formula Used</h4>
                <p className="text-sm text-muted-foreground">{calculationDetails.formula}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">Calculation Steps</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {calculationDetails.steps.map((step, index) => (
                    <li key={`${item.id}-calc-${index}`}>{step}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">Final Result</h4>
                <p className="text-sm font-medium">{calculationDetails.result.toLocaleString()} kWh</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {item.specifications && Object.entries(item.specifications).map(([key, value], index) => {
            // Handle different value types
            const displayValue = typeof value === 'object' 
              ? JSON.stringify(value)
              : String(value);
            
            return (
              <div key={`${item.id}-spec-${key}-${index}`} className="text-sm text-muted-foreground">
                {key}: {displayValue}
              </div>
            );
          })}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          {typeof onEdit === 'function' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(item.id)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {typeof onDelete === 'function' && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(item.id)}
              className="h-8 w-8 text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}; 