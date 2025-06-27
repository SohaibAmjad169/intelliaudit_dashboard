import React, { useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCollapsible } from './CollapsibleContext';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  defaultOpen = true,
  className = '',
  headerClassName = '',
  children
}) => {
  const { registerSection, toggleSection, isExpanded } = useCollapsible();
  const open = isExpanded(id);

  useEffect(() => {
    registerSection(id, defaultOpen);
  }, [id, defaultOpen, registerSection]);

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <button
        onClick={() => toggleSection(id)}
        className={`w-full px-6 py-4 flex items-center justify-between text-left ${headerClassName}`}
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
};
