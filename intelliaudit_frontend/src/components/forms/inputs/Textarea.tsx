import React, { forwardRef } from 'react';
import { Textarea as ShadcnTextarea } from "@components/ui/textarea";
import { cn } from '@/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <ShadcnTextarea
          ref={ref}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);
