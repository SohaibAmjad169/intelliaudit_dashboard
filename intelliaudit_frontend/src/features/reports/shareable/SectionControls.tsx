import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface SectionState {
  executiveSummary: boolean;
  projectInfo: boolean;
  summaryTables: boolean;
  energyAudit: boolean;
  waterAudit: boolean;
  retroCommissioning: boolean;
  measuresAnalysis: boolean;
  financialAnalysis: boolean;
  nextSteps: boolean;
  energyUsage: boolean;
  endUseBreakdown: boolean;
  utilityData: boolean;
  waterData: boolean;
  siteOverview: boolean;
  recommendations: boolean;
  equipment: boolean;
  photos: boolean;
  appendices: boolean;
}

interface SectionControlsProps {
  visibleSections: SectionState;
  toggleSection: (section: keyof SectionState) => void;
}

export const SectionControls: React.FC<SectionControlsProps> = ({ 
  visibleSections, 
  toggleSection 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-8">
      <h3 className="text-base font-medium mb-4 text-gray-900 dark:text-white">Report Sections</h3>
      <div className="space-y-2">
        <SectionButton 
          label="Executive Summary" 
          isVisible={visibleSections.executiveSummary}
          onClick={() => toggleSection('executiveSummary')}
        />
        <SectionButton 
          label="Energy Audit Report" 
          isVisible={visibleSections.energyAudit}
          onClick={() => toggleSection('energyAudit')}
        />
        <SectionButton 
          label="Water Audit Report" 
          isVisible={visibleSections.waterAudit}
          onClick={() => toggleSection('waterAudit')}
        />
        <SectionButton 
          label="Retrocommissioning Report" 
          isVisible={visibleSections.retroCommissioning}
          onClick={() => toggleSection('retroCommissioning')}
        />
        <SectionButton 
          label="Appendices" 
          isVisible={visibleSections.appendices}
          onClick={() => toggleSection('appendices')}
        />
      </div>
    </div>
  );
};

interface SectionButtonProps {
  label: string;
  isVisible: boolean;
  onClick: () => void;
}

const SectionButton: React.FC<SectionButtonProps> = ({ label, isVisible, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex justify-between items-center w-full px-3 py-2 rounded-md text-left ${
        isVisible 
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' 
          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      }`}
    >
      <span>{label}</span>
      {isVisible ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );
}; 