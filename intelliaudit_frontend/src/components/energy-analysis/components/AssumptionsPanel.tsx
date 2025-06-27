import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Assumption, AssumptionSource } from '../types/energyAnalysis.types';

interface AssumptionsPanelProps {
  assumptions: Record<string, Assumption>;
}

export const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  assumptions
}) => {
  // Group assumptions by category
  const groupedAssumptions: Record<string, Record<string, Assumption>> = {
    'Occupancy': {},
    'Lighting': {},
    'HVAC': {},
    'Appliances': {},
    'Water': {},
    'Other': {}
  };
  
  // Map assumption keys to categories
  const categoryMap: Record<string, string> = {
    'occupancyRate': 'Occupancy',
    'exteriorLightingHours': 'Lighting',
    'commonAreaLightingHours': 'Lighting',
    'apartmentLightingHours': 'Lighting',
    'coolingHours': 'HVAC',
    'heatingHours': 'HVAC',
    'refrigeratorDutyCycle': 'Appliances',
    'waterUsagePerPerson': 'Water'
  };
  
  // Organize assumptions into groups
  Object.entries(assumptions).forEach(([key, assumption]) => {
    const category = categoryMap[key] || 'Other';
    groupedAssumptions[category][key] = assumption;
  });
  
  // Helper function to get a human-readable title from a camelCase key
  const getTitle = (key: string): string => {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };
  
  // Get badge color for assumption source
  const getSourceBadge = (source: AssumptionSource) => {
    switch (source) {
      case 'measured':
        return <Badge className="bg-green-500">Measured</Badge>;
      case 'calculated':
        return <Badge className="bg-blue-500">Calculated</Badge>;
      case 'estimated':
      default:
        return <Badge className="bg-amber-500">Estimated</Badge>;
    }
  };
  
  return (
    <div className="space-y-8">
      {Object.entries(groupedAssumptions).map(([category, items]) => {
        const assumptionEntries = Object.entries(items);
        if (assumptionEntries.length === 0) return null;
        
        return (
          <div key={category}>
            <h3 className="text-lg font-medium mb-4">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assumptionEntries.map(([key, assumption]) => (
                <div key={key} className="bg-muted/50 p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{getTitle(key)}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {assumption.description}
                      </div>
                    </div>
                    {getSourceBadge(assumption.source)}
                  </div>
                  <div className="mt-3 text-xl">{assumption.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            These assumptions are used to calculate the energy breakdown and may be adjusted to more 
            accurately match utility bills and observed equipment usage patterns.
          </p>
          <p>
            <strong>Note:</strong> For this project, occupancy rate and usage hours were scaled back 
            due to lower than typical water and energy consumption.
          </p>
        </div>
      </div>
    </div>
  );
}; 