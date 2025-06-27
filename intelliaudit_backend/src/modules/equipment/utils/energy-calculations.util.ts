/**
 * Utility functions for energy calculations
 */

/**
 * Calculate annual hours based on operating hours and days per week
 * @param operatingHours Daily operating hours
 * @param daysPerWeek Days of operation per week (defaults to 7)
 * @returns Annual operating hours
 */
export function calculateAnnualHours(operatingHours: number, daysPerWeek: number = 7): number {
  if (!operatingHours || operatingHours <= 0) return 0;
  
  // Weekly hours = daily hours * days per week
  const weeklyHours = operatingHours * daysPerWeek;
  
  // Annual hours = weekly hours * 52 weeks
  return weeklyHours * 52;
}

/**
 * Calculate annual kWh for equipment
 * @param wattage Equipment wattage
 * @param quantity Number of units
 * @param operatingHours Daily operating hours
 * @param daysPerWeek Days of operation per week (defaults to 7)
 * @param totalApartmentCount Total apartment count (for apartment equipment)
 * @param isApartmentEquipment Whether this is apartment equipment
 * @returns Annual kWh
 */
export function calculateAnnualKwh(
  wattage: number,
  quantity: number = 1,
  operatingHours: number,
  daysPerWeek: number = 7,
  totalApartmentCount: number = 1,
  isApartmentEquipment: boolean = false
): number {
  if (!wattage || wattage <= 0 || !operatingHours || operatingHours <= 0) return 0;
  
  // Annual kWh = (wattage / 1000) * quantity * operatingHours * (daysPerWeek * 52)
  let annualKwh = (wattage / 1000) * quantity * operatingHours * (daysPerWeek * 52);
  
  // If it's apartment equipment, multiply by the total number of apartments
  if (isApartmentEquipment) {
    annualKwh *= totalApartmentCount;
  }
  
  // Round to nearest whole number
  return Math.round(annualKwh);
}

/**
 * Generate calculation details object for tracking calculation metadata
 * @param calculationSource Source of the calculation
 * @returns Calculation details object
 */
export function generateCalculationDetails(calculationSource: string = 'code'): any {
  return {
    last_calculated: new Date().toISOString(),
    calculation_source: calculationSource,
    data_quality_flags: []
  };
}

/**
 * Update equipment with calculated energy values
 * @param equipment Equipment item to update
 * @param projectDetails Optional project details for apartment calculations
 * @returns Updated equipment with energy calculations
 */
export function updateEquipmentEnergyCalculations(equipment: any, projectDetails?: any): any {
  const updatedEquipment = { ...equipment };
  
  // Extract values with defaults
  const wattage = Number(updatedEquipment.wattage) || 0;
  const quantity = Number(updatedEquipment.quantity) || 1;
  const operatingHours = Number(updatedEquipment.operating_hours) || 0;
  const daysPerWeek = Number(updatedEquipment.days_per_week) || 7;
  
  // Determine if this is apartment equipment
  const isApartmentEquipment = updatedEquipment.area_type === 'apartment' || 
                              updatedEquipment.location === 'Apartment' ||
                              (updatedEquipment.calculation_details?.is_apartment_item === true);
  
  // Get total apartment count from project details or default to 1
  const totalApartmentCount = (projectDetails?.apartment_count || 1);
  
  // Calculate annual hours
  updatedEquipment.annual_hours = calculateAnnualHours(operatingHours, daysPerWeek);
  
  // Calculate annual kWh
  updatedEquipment.annual_kwh = calculateAnnualKwh(
    wattage, 
    quantity, 
    operatingHours, 
    daysPerWeek, 
    totalApartmentCount, 
    isApartmentEquipment
  );
  
  // Update calculation details
  updatedEquipment.calculation_details = {
    ...(updatedEquipment.calculation_details || {}),
    ...generateCalculationDetails('code_util'),
    applied_formula: `(${wattage}W / 1000) * ${quantity} * ${operatingHours}h * (${daysPerWeek} * 52)${isApartmentEquipment ? ` * ${totalApartmentCount} apartments` : ''}`,
    params: {
      wattage,
      quantity,
      operating_hours: operatingHours,
      days_per_week: daysPerWeek,
      is_apartment_item: isApartmentEquipment,
      apartment_multiplier: isApartmentEquipment ? totalApartmentCount : 1
    }
  };
  
  return updatedEquipment;
} 