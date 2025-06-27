// Format currency
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format number with commas
export const formatNumber = (value: number | undefined) => {
  if (value === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

// Format currency per square foot
export const formatCostPerSqFt = (cost: number, sqft: number) => {
  if (!sqft) return '$0.00/ft²';
  return `$${(cost / sqft).toFixed(2)}/ft²`;
};

// Format energy usage per square foot
export const formatEnergyUsagePerSqFt = (usage: number, sqft: number) => {
  if (!sqft) return '0.0 kWh/ft²';
  return `${(usage / sqft).toFixed(1)} kWh/ft²`;
};

// Format water usage per square foot
export const formatWaterUsagePerSqFt = (usage: number, sqft: number) => {
  if (!sqft) return '0.0 gal/ft²';
  return `${(usage / sqft).toFixed(1)} gal/ft²`;
}; 