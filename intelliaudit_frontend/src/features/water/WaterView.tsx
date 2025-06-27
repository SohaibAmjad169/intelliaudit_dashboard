import React, { useMemo } from 'react';
import { Droplet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EquipmentItem } from '@/features/energy/types'; 
import { formatNumber } from '@/utils/formatting';
import { SourceBadge } from '@/features/energy/components/EquipmentTable/SourceBadge';

interface WaterViewProps {
  equipment: EquipmentItem[];
  isLoading: boolean;
  error: string | null;
}

// Estimation Constants for various fixture types
const GPM_PER_FIXTURE: { [key: string]: number } = {
  'toilet': 1.6, // GPF (gallons per flush)
  'faucet': 1.5, // GPM
  'showerhead': 2.0, // GPM
  'sink': 1.5, // GPM
  'urinal': 1.0, // GPF
  'water heater': 0, // Special calculation
  'dishwasher': 6.0, // Gallons per cycle
  'washing machine': 20.0, // Gallons per cycle
};

// Usage factors (% of time in use during operation)
const USAGE_FACTOR: { [key: string]: number } = {
  'toilet': 0.05, // 5% of the time
  'faucet': 0.1, // 10% of the time
  'showerhead': 0.25, // 25% of the time
  'sink': 0.1, // 10% of the time
  'urinal': 0.05, // 5% of the time
  'water heater': 1.0, // Always supplying
  'dishwasher': 0.02, // 2% of the time (cycles per week)
  'washing machine': 0.01, // 1% of the time (cycles per week)
};

// Daily uses per apartment fixture
const DAILY_USES_PER_APARTMENT: { [key: string]: number } = {
  'toilet': 5, // Flushes per day
  'faucet': 8, // Uses per day
  'showerhead': 1.5, // Showers per day
  'sink': 8, // Uses per day
  'urinal': 0, // Not typically in apartments
  'dishwasher': 0.5, // Runs per day (every other day)
  'washing machine': 0.3, // Runs per day (few times a week)
};

// Add a utility function to get flow rate as a number
const getFlowRateAsNumber = (item: EquipmentItem, fixtureType: string): number => {
  const flowRateSpec = item.specifications?.flowRate;
  const flowRateGpmSpec = item.specifications?.flowRateGpm;
  
  // Try to get from specifications first
  if (flowRateSpec !== undefined && flowRateSpec !== null) {
    return typeof flowRateSpec === 'string' ? parseFloat(flowRateSpec) || 0 : flowRateSpec || 0;
  }
  
  if (flowRateGpmSpec !== undefined && flowRateGpmSpec !== null) {
    return typeof flowRateGpmSpec === 'string' ? parseFloat(flowRateGpmSpec) || 0 : flowRateGpmSpec || 0;
  }
  
  // Fall back to constants
  return GPM_PER_FIXTURE[fixtureType] || 0;
};

// Function to estimate water usage in gallons, then convert to HCF
const estimateWaterUsage = (item: EquipmentItem): number | null => {
  const itemType = item.equipment_type?.toLowerCase() || '';
  const quantity = item.quantity || 1;
  
  // Try to find the fixture type in our mapping
  let fixtureType = Object.keys(GPM_PER_FIXTURE).find(type => 
    itemType.includes(type)
  );
  
  if (!fixtureType) {
    // If we can't identify the fixture type, check the category
    if (item.category?.toLowerCase().includes('plumbing')) {
      fixtureType = 'faucet'; // Default to faucet if it's plumbing
    } else {
      return null; // Cannot estimate for this item
    }
  }
  
  // Get flow rate - either from specifications or from our constants
  const flowRateGpm = getFlowRateAsNumber(item, fixtureType);
  
  if (!flowRateGpm) return null;
  
  let annualGallons = 0;
  
  // Special calculation for toilets and urinals (using flushes, not flow time)
  if (fixtureType === 'toilet' || fixtureType === 'urinal') {
    const flushesPerDay = DAILY_USES_PER_APARTMENT[fixtureType] || 5;
    annualGallons = flowRateGpm * flushesPerDay * 365 * quantity;
  }
  // Special calculation for dishwashers and washing machines (using cycles)
  else if (fixtureType === 'dishwasher' || fixtureType === 'washing machine') {
    const cyclesPerDay = DAILY_USES_PER_APARTMENT[fixtureType] || 0.5;
    annualGallons = flowRateGpm * cyclesPerDay * 365 * quantity;
  }
  // Standard flow calculation for other fixtures
  else {
    // Get operating hours - either from item or use a reasonable default
    const weeklyHours = item.operating_hours || item.weekly_hours || item.weeklyHours || 40;
    
    // Estimate how many minutes per week this fixture runs
    const minutesPerWeek = weeklyHours * 60 * USAGE_FACTOR[fixtureType];
    
    // Calculate weekly gallons
    const weeklyGallons = flowRateGpm * minutesPerWeek * quantity;
    
    // Annual gallons
    annualGallons = weeklyGallons * 52;
  }
  
  // Convert gallons to HCF (Hundred Cubic Feet), 1 HCF = 748 gallons
  const annualHCF = annualGallons / 748;
  
  return annualHCF;
};

export const WaterView: React.FC<WaterViewProps> = ({ equipment, isLoading, error }) => {
  // Filter plumbing items and calculate water usage
  const plumbingItems = useMemo(() => {
    return equipment
      .filter(item => {
        const type = item.equipment_type?.toLowerCase() || '';
        const category = item.category?.toLowerCase() || '';
        
        return category.includes('plumbing') || 
               type.includes('toilet') || 
               type.includes('faucet') || 
               type.includes('shower') ||
               type.includes('sink') ||
               type.includes('urinal') ||
               type.includes('water heater') ||
               type.includes('dishwasher') ||
               type.includes('washing machine');
      })
      .map(item => ({
        ...item,
        estimatedAnnualUsageHCF: estimateWaterUsage(item),
      }))
      .sort((a, b) => {
        // Sort by category, then by equipment type
        const catA = a.category || '';
        const catB = b.category || '';
        
        if (catA !== catB) return catA.localeCompare(catB);
        
        const typeA = a.equipment_type || '';
        const typeB = b.equipment_type || '';
        return typeA.localeCompare(typeB);
      });
  }, [equipment]);

  // Calculate total estimated water usage
  const totalEstimatedUsageHCF = useMemo(() => {
    return plumbingItems.reduce((sum, item) => sum + (item.estimatedAnnualUsageHCF || 0), 0);
  }, [plumbingItems]);

  // Format location for display
  const formatLocation = (location?: string | any): string => {
    if (!location) return 'N/A';
    
    if (typeof location === 'string') {
      return location;
    } else if (typeof location === 'object') {
      return location.room || location.area || 'N/A';
    }
    
    return 'N/A';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading water-related equipment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Droplet className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold">Water Usage Estimation</h2>
      </div>

      {plumbingItems.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground border rounded-md">
          No plumbing equipment found for water usage estimation. Try adding plumbing fixtures in the equipment section.
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Flow Rate</TableHead>
                  <TableHead className="text-right">Est. Annual Usage (HCF)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plumbingItems.map((item, index) => (
                  <TableRow key={`${item.id}-${index}`} className="hover:bg-muted/50">
                    <TableCell>
                      <div>{item.equipment_type || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{item.category || 'Plumbing'}</div>
                    </TableCell>
                    <TableCell>{formatLocation(item.location)}</TableCell>
                    <TableCell><SourceBadge source={item.source || 'database'} /></TableCell>
                    <TableCell className="text-right">{item.quantity || 1}</TableCell>
                    <TableCell className="text-right">
                      {item.specifications?.flowRate || item.specifications?.flowRateGpm ? 
                        `${item.specifications.flowRate || item.specifications.flowRateGpm} GPM` : 
                        'Est.'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.estimatedAnnualUsageHCF !== null ? 
                        formatNumber(item.estimatedAnnualUsageHCF, 1) : 
                        'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Grand Total Row */}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={5} className="text-right">Total Estimated Annual Usage</TableCell>
                  <TableCell className="text-right">{formatNumber(totalEstimatedUsageHCF, 1)} HCF</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="text-sm text-muted-foreground">
            *Estimated usage is based on industry standards and assumed operating patterns. 
            Flow rates are industry defaults if not specified. 1 HCF (Hundred Cubic Feet) = 748 gallons.
          </div>
          
          {/* Placeholder for Variance */}
          <div className="mt-4 p-4 border border-dashed rounded-md bg-muted/5">
            <h3 className="text-lg font-medium mb-2">Variance Analysis</h3>
            <p className="text-muted-foreground">
              Water usage variance analysis requires baseline utility data for comparison.
              Add water utility bills to enable variance calculations between estimated and actual usage.
            </p>
          </div>
        </>
      )}
    </div>
  );
}; 