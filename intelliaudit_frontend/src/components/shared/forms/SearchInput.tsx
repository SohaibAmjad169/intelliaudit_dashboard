import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/forms/inputs/Input';
import { cn } from '@/utils';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/shared/actions/Button';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Callback when search value changes */
  onChange?: (value: string) => void;
  /** Callback when search is submitted */
  onSearch?: (value: string) => void;
  /** Delay in ms before triggering onChange (debounce) */
  debounceMs?: number;
  /** Whether to show the clear button */
  showClear?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class name */
  className?: string;
  /** Error state */
  error?: boolean;
  /** Helper text to display */
  helperText?: string;
}

/**
 * SearchInput component for search functionality
 * 
 * @example
 * ```tsx
 * <SearchInput 
 *   placeholder="Search users..." 
 *   onChange={(value) => console.log(value)}
 *   onSearch={(value) => fetchResults(value)}
 * />
 * ```
 */
export function SearchInput({
  onChange,
  onSearch,
  debounceMs = 300,
  showClear = true,
  placeholder = 'Search...',
  className,
  error = false,
  helperText = '',
  ...props
}: SearchInputProps) {
  const [value, setValue] = useState<string>(props.defaultValue?.toString() || '');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (onChange) {
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    }
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    }
  };

  // Clear the search input
  const handleClear = () => {
    setValue('');
    if (onChange) {
      onChange('');
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn('relative', className)}
    >
      <Input
        {...props}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn('pr-16', className)}
        error={error}
        helperText={helperText}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {showClear && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-1"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  );
} 