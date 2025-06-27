import React from 'react';
import { Skeleton as SkeletonPrimitive } from '@/components/ui/skeleton';
import { cn } from '@/utils';

export interface SkeletonProps {
  /** The width of the skeleton */
  width?: string | number;
  /** The height of the skeleton */
  height?: string | number;
  /** The shape of the skeleton */
  variant?: 'rectangle' | 'circle' | 'text';
  /** Additional class name for the skeleton */
  className?: string;
}

/**
 * Skeleton component for displaying loading states
 * 
 * @example
 * ```tsx
 * <Skeleton width={200} height={20} />
 * ```
 */
export function Skeleton({
  width,
  height,
  variant = 'rectangle',
  className,
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'h-4 w-full rounded';
      case 'rectangle':
      default:
        return 'rounded-md';
    }
  };

  const style: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <SkeletonPrimitive
      className={cn(getVariantClasses(), className)}
      style={style}
    />
  );
} 