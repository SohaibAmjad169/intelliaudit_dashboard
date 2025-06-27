import React from 'react';

interface PlaceholderHighlightProps {
  children: React.ReactNode;
  isPlaceholder?: boolean;
  defaultValue?: any;
  actualValue?: any;
  boldDatabaseValues?: boolean;
}

/**
 * A component that highlights placeholder/default data with a yellow background
 * Can be used throughout the application for consistent styling of placeholder data
 * 
 * @param children The content to display
 * @param isPlaceholder Optional direct flag to indicate if content is a placeholder
 * @param defaultValue Optional default value to compare with actualValue 
 * @param actualValue Optional actual value to compare with defaultValue
 * @param boldDatabaseValues Optional flag to bold values from database (not placeholders)
 */
export function PlaceholderHighlight({ 
  children, 
  isPlaceholder,
  defaultValue, 
  actualValue,
  boldDatabaseValues = true
}: PlaceholderHighlightProps) {
  // Determine if this is a placeholder based on the props
  const isActuallyPlaceholder = 
    isPlaceholder !== undefined ? isPlaceholder : 
    (defaultValue !== undefined && actualValue !== undefined) ? 
      (!actualValue || actualValue === defaultValue) : false;

  // Apply the placeholder highlighting class if this is a placeholder
  const placeholderClass = "bg-yellow-100 dark:bg-yellow-800/50 px-1 rounded";
  
  // If it's not a placeholder and boldDatabaseValues is true, wrap in strong tags
  if (!isActuallyPlaceholder && boldDatabaseValues) {
    return (
      <strong>{children}</strong>
    );
  }
  
  return (
    <span className={isActuallyPlaceholder ? placeholderClass : ""}>
      {children}
    </span>
  );
}

export default PlaceholderHighlight; 