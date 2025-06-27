export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Return in format: "Dec 23, 2024"
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
