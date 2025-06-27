import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class strings together with Tailwind CSS optimizations
 * @param inputs Class string inputs
 * @returns Merged and optimized class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 