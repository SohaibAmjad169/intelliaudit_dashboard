import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical } from 'lucide-react';
import { SectionState } from './SectionControls';

interface SectionItem {
  id: keyof SectionState;
  label: string;
}

interface DraggableSectionProps {
  section: SectionItem;
  isVisible: boolean;
  toggleSection: (section: keyof SectionState) => void;
}

export const DraggableSection: React.FC<DraggableSectionProps> = ({ 
  section, 
  isVisible, 
  toggleSection 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex justify-between items-center w-full px-3 py-2 mb-2 rounded-md text-left transition-colors ${
        isVisible 
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium' 
          : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600/50'
      }`}
    >
      <div className="flex items-center flex-1" onClick={() => toggleSection(section.id)}>
        <FileText className="h-4 w-4 mr-2 opacity-70" />
        <span>{section.label}</span>
      </div>
      <div 
        className="cursor-move p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  );
};

export const getSectionItems = (): SectionItem[] => {
  return [
    { id: 'executiveSummary', label: 'Executive Summary' },
    { id: 'energyAudit', label: 'Energy Audit Report' },
    { id: 'waterAudit', label: 'Water Audit Report' },
    { id: 'retroCommissioning', label: 'Retrocommissioning Report' },
    { id: 'appendices', label: 'Appendices' }
  ];
}; 