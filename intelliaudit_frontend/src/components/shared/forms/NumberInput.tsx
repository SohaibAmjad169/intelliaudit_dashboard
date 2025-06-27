import React, { useState, useEffect } from 'react';
import { Input } from '@/components/forms/inputs/Input';
import { cn } from '@/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/shared/actions/Button';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Callback when value changes */
  onChange?: (value: number | null) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step value for increment/decrement */
  step?: number;
  /** Whether to show increment/decrement buttons */
  showControls?: boolean;
  /** Format function for the displayed value */
  formatValue?: (value: number | null) => string;
  /** Parse function for the input value */
  parseValue?: (value: string) => number | null;
  /** Additional class name */
  className?: string;
  /** Error state */
  error?: boolean;
  /** Helper text to display */
  helperText?: string;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * NumberInput component for numeric input
 * 
 * @example
 * ```tsx
 * <NumberInput 
 *   min={0} 
 *   max={100} 
 *   step={5} 
 *   onChange={(value) => console.log(value)}
 * />
 * ```
 */
export function NumberInput({
  onChange,
  min,
  max,
  step = 1,
  showControls = true,
  formatValue = (value) => value?.toString() || '',
  parseValue = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  },
  className,
  error = false,
  helperText = '',
  placeholder = '',
  ...props
}: NumberInputProps) {
  const [value, setValue] = useState<number | null>(
    props.defaultValue !== undefined 
      ? parseValue(props.defaultValue.toString()) 
      : null
  );
  const [displayValue, setDisplayValue] = useState<string>(
    formatValue(value)
  );

  // Update the display value when the value changes
  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value, formatValue]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    const parsedValue = parseValue(inputValue);
    setValue(parsedValue);
    
    if (onChange) {
      onChange(parsedValue);
    }
  };

  // Handle blur to format the value
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Apply constraints (min/max)
    let constrainedValue = value;
    
    if (value !== null) {
      if (min !== undefined && value < min) {
        constrainedValue = min;
      } else if (max !== undefined && value > max) {
        constrainedValue = max;
      }
    }
    
    // Update if constrained
    if (constrainedValue !== value) {
      setValue(constrainedValue);
      if (onChange) {
        onChange(constrainedValue);
      }
    }
    
    // Format the display value
    setDisplayValue(formatValue(constrainedValue));
    
    // Call the original onBlur if provided
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  // Increment the value
  const increment = () => {
    if (value === null) {
      const newValue = min !== undefined ? min : 0;
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    } else {
      const newValue = value + step;
      if (max === undefined || newValue <= max) {
        setValue(newValue);
        if (onChange) {
          onChange(newValue);
        }
      }
    }
  };

  // Decrement the value
  const decrement = () => {
    if (value === null) {
      const newValue = min !== undefined ? min : 0;
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    } else {
      const newValue = value - step;
      if (min === undefined || newValue >= min) {
        setValue(newValue);
        if (onChange) {
          onChange(newValue);
        }
      }
    }
  };

  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          showControls && 'pr-10',
          className
        )}
        error={error}
        helperText={helperText}
        placeholder={placeholder}
      />
      {showControls && (
        <div className="absolute inset-y-0 right-0 flex flex-col h-full">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-1/2 w-8 flex items-end justify-center pb-1"
            onClick={increment}
            tabIndex={-1}
          >
            <ChevronUp className="h-3 w-3" />
            <span className="sr-only">Increment</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-1/2 w-8 flex items-start justify-center pt-1"
            onClick={decrement}
            tabIndex={-1}
          >
            <ChevronDown className="h-3 w-3" />
            <span className="sr-only">Decrement</span>
          </Button>
        </div>
      )}
    </div>
  );
} 