import React, { forwardRef } from 'react';
import { Input as ShadcnInput } from "@components/ui/input";
import { cn } from '@/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <ShadcnInput
          ref={ref}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              "mt-1 text-sm",
              error ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
