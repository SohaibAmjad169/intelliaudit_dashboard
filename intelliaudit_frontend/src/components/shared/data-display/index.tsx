import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/utils";

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const { isDarkMode } = useTheme();
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        isDarkMode ? "bg-dark-900" : "bg-gray-100",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all",
          isDarkMode ? "bg-dark-300" : "bg-gray-900"
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

export * from './Badge';
export * from './EmptyState';
