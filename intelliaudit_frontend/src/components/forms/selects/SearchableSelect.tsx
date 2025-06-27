import React from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

export interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  className?: string;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isDisabled = false,
  isLoading = false,
  isClearable = true,
  className = '',
  required = false,
}) => {
  // Convert value to string format expected by Combobox
  const selectedValue = value ? value.value : null;

  // Handle the change from Combobox (string) back to Option format
  const handleChange = (newValue: string | null) => {
    if (newValue === null) {
      onChange(null);
    } else {
      const selectedOption = options.find(opt => opt.value === newValue);
      if (selectedOption) {
        onChange(selectedOption);
      }
    }
  };

  // Convert options to ComboboxOption format if needed
  const comboboxOptions: ComboboxOption[] = options;

  return (
    <Combobox
      options={comboboxOptions}
      value={selectedValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={isDisabled || isLoading}
      triggerClassName={className}
      clearable={isClearable && !required}
      searchPlaceholder="Search..."
      emptyMessage={isLoading ? "Loading..." : "No options found."}
    />
  );
};
