import { Equipment } from '@/types/equipment';
import { ProcessedEquipment } from '@/types/equipment-processing';

export function convertToEquipment(processed: ProcessedEquipment): Equipment {
  const condition = typeof processed.details.condition === 'string' 
    ? processed.details.condition 
    : (processed.details.condition?.overall || 'Unknown');
    
  return {
    id: processed.id,
    name: processed.details.make || processed.type,
    type: processed.type,
    condition,
    age: processed.details.age ? parseInt(processed.details.age) : 0,
    efficiency: processed.details.efficiency ? parseFloat(processed.details.efficiency) : 0
  };
}

export function convertToProcessedEquipment(equipment: Equipment): ProcessedEquipment {
  // Default values for required fields
  const defaultWattage = 100; // Default wattage in watts
  const defaultHoursPerDay = 8; // Default operating hours per day
  const weeklyHours = defaultHoursPerDay * 7;
  const annualHours = weeklyHours * 52;
  const annualKwh = (defaultWattage * annualHours) / 1000; // kWh calculation
  const annualCost = annualKwh * 0.15; // Using $0.15/kWh as default rate

  return {
    id: equipment.id,
    name: equipment.name,
    type: equipment.type,
    category: 'other',
    quantity: 1,
    wattage: defaultWattage,
    operating_hours: defaultHoursPerDay,
    operatingHours: defaultHoursPerDay,
    weeklyHours: weeklyHours,
    annual_kwh: annualKwh,
    annual_cost: annualCost,
    details: {
      make: equipment.name,
      condition: {
        overall: (equipment.condition as 'Good' | 'Fair' | 'Poor'),
        visibleIssues: []
      },
      age: equipment.age.toString(),
      efficiency: equipment.efficiency.toString(),
      wattage: defaultWattage,
      operatingHours: defaultHoursPerDay
    },
    location: {
      name: 'Unknown Location',
      room: 'Unknown'
    },
    confidence: 1,
    source: 'notes',
    is_merged: false
  };
}

export function convertEquipmentArray(items: Equipment[] | ProcessedEquipment[]): ProcessedEquipment[] {
  return items.map(item => {
    if ('category' in item) {
      return item as ProcessedEquipment;
    }
    return convertToProcessedEquipment(item as Equipment);
  });
}
