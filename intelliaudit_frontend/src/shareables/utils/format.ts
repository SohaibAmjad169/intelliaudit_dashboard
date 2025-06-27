export function formatEnergy(kwh?: number | null): string {
  if (kwh == null || isNaN(kwh)) return '--';
  if (kwh >= 1_000_000) return `${(kwh / 1_000_000).toFixed(2)} M`;
  if (kwh >= 1_000) return `${(kwh / 1_000).toFixed(1)} k`; // thousands
  return kwh.toLocaleString();
}

export function formatCurrency(value?: number | null): string {
  if (value == null || isNaN(value)) return '$0';
  return `$${Math.round(value).toLocaleString()}`;
} 