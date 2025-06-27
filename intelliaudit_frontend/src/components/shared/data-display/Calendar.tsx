import { Calendar as CalendarPrimitive, CalendarProps as ShadCNCalendarProps } from '@/components/ui/calendar';
import { cn } from '@/utils';

export type CalendarProps = ShadCNCalendarProps;

/**
 * Calendar component for date selection
 * 
 * This component is a wrapper around the ShadCN UI Calendar component.
 * It provides a consistent interface for date selection in the application.
 * 
 * @example
 * ```tsx
 * <Calendar
 *   mode="single"
 *   selected={date}
 *   onSelect={setDate}
 *   className="rounded-md border"
 * />
 * ```
 */
export function Calendar(props: CalendarProps) {
  const { className, ...rest } = props;
  
  return (
    <CalendarPrimitive
      className={cn('rounded-md border', className)}
      {...rest}
    />
  );
} 