import { Progress as ProgressPrimitive } from '@/components/ui/progress';
import { cn } from '@/utils';

export interface ProgressProps {
  /** The current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Whether the progress is indeterminate */
  indeterminate?: boolean;
  /** Additional class name for the progress bar */
  className?: string;
}

/**
 * Progress component for displaying progress indicators
 * 
 * @example
 * ```tsx
 * <Progress value={75} />
 * ```
 */
export function Progress({
  value,
  max = 100,
  indeterminate = false,
  className,
}: ProgressProps) {
  // Calculate the percentage value
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  return (
    <ProgressPrimitive
      value={indeterminate ? undefined : percentage}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      style={{
        // Add animation for indeterminate state
        ...(indeterminate && {
          position: 'relative',
          overflow: 'hidden',
        }),
      }}
    />
  );
} 