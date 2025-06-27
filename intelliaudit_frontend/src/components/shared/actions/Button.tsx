import React from 'react';
import { Button as ShadcnButton } from "../../../components/ui/button";
import { cn } from '@/utils';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconSize?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      iconSize = 'md',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Map our variants to ShadCN variants
    const shadcnVariant = 
      variant === 'primary' ? 'default' : 
      variant as any;
    
    // Map our sizes to ShadCN sizes
    const shadcnSize = 
      size === 'md' ? 'default' :
      size === 'icon' ? 'icon' :
      size as any;
    
    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    return (
      <ShadcnButton
        className={className}
        variant={shadcnVariant}
        size={shadcnSize}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{React.cloneElement(leftIcon as any, { className: cn(iconSizes[iconSize]) })}</span>}
            {children}
            {rightIcon && <span className="ml-2">{React.cloneElement(rightIcon as any, { className: cn(iconSizes[iconSize]) })}</span>}
          </>
        )}
      </ShadcnButton>
    );
  }
);