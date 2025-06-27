/**
 * Default energy breakdown percentages for multifamily buildings
 * Based on industry standards and benchmarks
 */
export const MULTIFAMILY_DEFAULT_BREAKDOWN = [
  { name: 'Heating', defaultPercent: 15 },
  { name: 'Cooling', defaultPercent: 15 },
  { name: 'Ventilation', defaultPercent: 5 },
  { name: 'Interior Lighting', defaultPercent: 10 },
  { name: 'Exterior Lighting', defaultPercent: 5 },
  { name: 'Residential Appliances', defaultPercent: 10 },
  { name: 'Miscellaneous Electronics', defaultPercent: 5 },
  { name: 'Domestic Hot Water', defaultPercent: 20 },
  { name: 'Laundry Equipment', defaultPercent: 5 },
  { name: 'Residential Refrigeration', defaultPercent: 5 },
  { name: 'Vertical Transportation', defaultPercent: 3 },
  { name: 'Pools & Recreational', defaultPercent: 2 }
];

/**
 * Mapping between our system categories and standard multifamily categories
 */
export const CATEGORY_MAPPING = {
  // Direct mappings
  'Heating': 'Heating',
  'Cooling': 'Cooling',
  'Ventilation': 'Ventilation',
  'Lighting': ['Interior Lighting', 'Exterior Lighting'], // Split based on location
  'Water Heating': 'Domestic Hot Water',
  'Laundry': 'Laundry Equipment',
  'Elevator': 'Vertical Transportation',
  'Pool/Spa': 'Pools & Recreational',
  
  // Indirect mappings
  'Refrigeration': 'Residential Refrigeration',
  'Cooking': 'Residential Appliances',
  'Office Equipment': 'Miscellaneous Electronics',
  'Miscellaneous': 'Miscellaneous Electronics',
  
  // Fallbacks
  'Air Compressors': 'Miscellaneous Electronics',
  'Process': 'Miscellaneous Electronics',
  'Motors/Pumps': 'Miscellaneous Electronics'
};

/**
 * Reverse mapping from standard categories to our system categories
 */
export const REVERSE_CATEGORY_MAPPING = {
  'Heating': 'Heating',
  'Cooling': 'Cooling',
  'Ventilation': 'Ventilation',
  'Interior Lighting': 'Lighting',
  'Exterior Lighting': 'Lighting',
  'Residential Appliances': 'Cooking',
  'Miscellaneous Electronics': 'Miscellaneous',
  'Domestic Hot Water': 'Water Heating',
  'Laundry Equipment': 'Laundry',
  'Residential Refrigeration': 'Refrigeration',
  'Vertical Transportation': 'Elevator',
  'Pools & Recreational': 'Pool/Spa'
};
