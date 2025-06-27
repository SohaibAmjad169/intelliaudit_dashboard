import { Checkbox as ShadcnCheckbox } from "@components/ui/checkbox";
import { cn } from '@/utils';

interface CheckboxProps {
  label?: string;
  id?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export const Checkbox = ({
  label,
  id,
  className,
  checked,
  onChange,
  disabled,
}: CheckboxProps) => {
  const handleCheckedChange = (value: boolean | 'indeterminate') => {
    if (typeof value === 'boolean') {
      onChange?.(value);
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <ShadcnCheckbox
        id={id}
        checked={checked || false}
        onCheckedChange={handleCheckedChange}
        className={className}
        disabled={disabled}
      />
      {label && (
        <label 
          htmlFor={id} 
          className={cn(
            "text-sm text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
};
