import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isDarkMode?: boolean;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = 'Search...', 
  className = '',
  isDarkMode = false
}: SearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(' SearchInput raw value:', e.target.value);
    onChange(e.target.value);
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          isDarkMode 
            ? 'bg-dark-800 border-dark-700 text-light-50 placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }`}
        placeholder={placeholder}
      />
    </div>
  );
}
