import React from 'react';
import { useTheme } from "@/hooks/useTheme";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: number) => void;
}

export const NumberInput: React.FC<NumberInputProps> = ({ onChange, className = '', ...props }) => {
  const { isDarkMode } = useTheme();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
    onChange?.(value);
  };

  return (
    <input
      type="number"
      className={`
        block w-full rounded-md shadow-sm px-4 py-2
        border-[1px] border-solid
        focus:ring-primary focus:border-primary sm:text-sm
        ${isDarkMode 
          ? 'bg-dark-700 border-dark-500 text-light-50 focus:border-primary-600 placeholder-gray-400' 
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }
        ${className}
      `}
      onChange={handleChange}
      {...props}
    />
  );
};
