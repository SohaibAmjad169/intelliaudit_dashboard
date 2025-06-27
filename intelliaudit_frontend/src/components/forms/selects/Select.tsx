import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { cn } from '@/utils';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isDisabled?: boolean;
  id?: string;
}

export const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  isDisabled = false,
  className = '',
  id
}: SelectProps) => {
  const handleValueChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <ShadcnSelect 
      value={value || ""} 
      onValueChange={handleValueChange} 
      disabled={disabled || isDisabled}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
};
