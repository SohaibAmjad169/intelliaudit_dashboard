import React from 'react';
import { cn } from '@/utils/cn';

/**
 * A simple container component that replaces the previous GlowBox
 * with standard styling but no glow effects
 */
interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  /** @deprecated This property is ignored but kept for backward compatibility */
  intensity?: 'subtle' | 'medium' | 'strong';
  /** @deprecated This property is ignored but kept for backward compatibility */
  animated?: boolean;
  /** @deprecated This property is ignored but kept for backward compatibility */
  pulseEffect?: boolean;
  /** @deprecated This property is ignored but kept for backward compatibility */
  particleEffect?: boolean;
}

export function Box({
  children,
  className = '',
  intensity, // ignored, kept for backward compatibility
  animated, // ignored, kept for backward compatibility
  pulseEffect, // ignored, kept for backward compatibility
  particleEffect, // ignored, kept for backward compatibility
  ...props
}: BoxProps) {
  return (
    <div 
      className={cn(
        "rounded-lg border border-emerald-500/20 bg-card", 
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Re-export the card components for convenience
 */
export { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from './card';

/**
 * Re-export the table components for convenience
 */
export { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableCaption 
} from './table';
