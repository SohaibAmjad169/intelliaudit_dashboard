import React from 'react';
import { ChromePicker } from 'react-color';
import { useTheme } from "@/hooks/useTheme";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <Popover>
        <PopoverTrigger className={cn(
          "w-full flex items-center px-3 py-2 border rounded-md shadow-sm text-sm",
          isDarkMode
            ? "bg-dark-700 border-dark-600 hover:bg-dark-600 text-light-50"
            : "bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
        )}>
          <div
            className="w-6 h-6 rounded border border-gray-300 mr-2"
            style={{ backgroundColor: value }}
          />
          <span>{value}</span>
        </PopoverTrigger>

        <PopoverContent 
          className={cn(
            "p-2 rounded-md shadow-lg w-auto", 
            isDarkMode ? "bg-dark-700" : "bg-white"
          )}
          align="start"
        >
          <ChromePicker
            color={value}
            onChange={(color) => onChange(color.hex)}
            disableAlpha
            styles={{
              default: {
                body: {
                  background: isDarkMode ? '#1f2937' : '#fff',
                },
              },
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
