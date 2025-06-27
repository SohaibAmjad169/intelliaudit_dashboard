/**
 * Format a number with commas and optional decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @param options - Additional formatting options
 * @returns Formatted number string
 */
export const formatNumber = (value: number | undefined | null, decimals: number = 2, options: Intl.NumberFormatOptions = {}): string => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    ...options
  }).format(value);
};

/**
 * Format a currency value
 * @param value - The currency value to format
 * @param currency - Currency code (default: 'USD')
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number | undefined | null, 
  currency: string = 'USD', 
  options: Intl.NumberFormatOptions = {}
): string => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(value);
};

/**
 * Format a percentage value
 * @param value - The percentage value to format (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercent = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === undefined || value === null) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Format a date value
 * @param date - The date to format
 * @param options - Date formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | undefined | null,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Format a percentage value
 * @param value The value to format (0-100)
 * @param decimalPlaces Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  decimalPlaces: number = 1
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value / 100);
}; 