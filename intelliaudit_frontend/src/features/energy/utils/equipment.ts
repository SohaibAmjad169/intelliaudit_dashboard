import { EquipmentItem, Location } from '../types';

/**
 * Get wattage as a number
 */
export function getWattageAsNumber(item: any): number {
  if (item.wattage === undefined || item.wattage === null) {
    return 0;
  }
  return typeof item.wattage === 'string' ? parseFloat(item.wattage) || 0 : item.wattage || 0;
}

export const isApartmentEquipment = (item: EquipmentItem): boolean => {
  // Check if the item is explicitly located in an apartment unit
  const isInApartmentUnit = Boolean(
    item.location && 
    (typeof item.location === 'string' 
      ? item.location.toLowerCase().includes('apartment unit') || 
        Boolean(item.location.toLowerCase().match(/\b(unit|apt)(\s+|-)?\d+\b/i))
      : (item.location as Location).room?.toLowerCase().includes('apartment unit') || 
        Boolean((item.location as Location).room?.toLowerCase().match(/\b(unit|apt)(\s+|-)?\d+\b/i))
    )
  );
    
  // Check if it's specifically labeled as being in a common area
  const isInCommonArea = Boolean(
    item.location && 
    (typeof item.location === 'string' 
      ? ['common', 'lobby', 'hallway', 'stairwell', 'building', 'roof', 'basement', 'laundry'].some(loc => 
          item.location && item.location.toString().toLowerCase().includes(loc)
        )
      : ['common', 'lobby', 'hallway', 'stairwell', 'building', 'roof', 'basement', 'laundry'].some(loc => 
          (item.location as Location).room?.toLowerCase().includes(loc)
        )
    )
  );
    
  // Check if it's central equipment
  const isCentralEquipment = Boolean(
    item.equipment_type && 
    ['boiler', 'chiller', 'cooling tower', 'elevator', 'central', 'water heater'].some(type => 
      item.equipment_type?.toLowerCase().includes(type)
    )
  );
    
  // Check if it's typical in-unit appliance
  const isResidentialAppliance = Boolean(
    item.equipment_type && 
    ['refrigerator', 'dishwasher', 'microwave', 'stove', 'oven', 'television', 'computer', 
     'bathroom fan', 'kitchen appliance'].some(type => 
      item.equipment_type?.toLowerCase().includes(type)
    )
  );
    
  // Laundry equipment in the "Laundry" location should NOT be considered apartment equipment
  const isLaundryEquipment = Boolean(
    (item.equipment_type?.toLowerCase().includes('washer') || 
     item.equipment_type?.toLowerCase().includes('dryer')) && 
    (typeof item.location === 'string' && 
     item.location.toLowerCase().includes('laundry'))
  );
    
  // If it's explicitly in an apartment unit or a residential appliance without being in a common area, 
  // consider it an apartment item. Otherwise, it's not.
  return (isInApartmentUnit || (isResidentialAppliance && !isInCommonArea)) && 
         !isInCommonArea && 
         !isCentralEquipment && 
         !isLaundryEquipment;
};

export const calculateAnnualKwh = (
  item: EquipmentItem,
  totalApartmentCount = 1,
  isApartmentItem = false
): number => {
  let annualKwh = 0;
  const quantity = item.quantity || 1;
  const weeklyHours = item.weekly_hours || item.weeklyHours || item.operating_hours || 40;
  const wattage = getWattageAsNumber(item);
  
  annualKwh = (wattage * quantity * weeklyHours * 52) / 1000;
  
  // Other existing calculations...
  
  // Finally, if it's an apartment item, multiply by the number of apartments
  if (isApartmentItem) {
    annualKwh *= totalApartmentCount;
  }
  
  return annualKwh;
}; 