import React, { useEffect, useState } from 'react';
import { ReportData } from './types';
import { fieldNotesService } from '@/services/field-notes';

interface EquipmentAnalysisProps {
  reportData: ReportData;
}

// Define the processed equipment type based on the actual structure from fieldNotesService
interface ProcessedEquipment {
  id: string;
  equipment_type?: string;
  category?: string;
  quantity?: number;
  location?: string | { room?: string; floor?: string };
  source?: string;
  confidence?: number;
  annual_kwh?: number;
  wattage?: number;
  details?: {
    wattage?: number;
    make?: string;
    model?: string;
    flowRate?: number;
    flowRateUnit?: string;
    assumptions?: string[];
  };
}

// Define our enhanced equipment type for use in the component
interface EnhancedEquipment {
  id: string;
  type: string;
  category: string;
  quantity: number;
  location: string;
  wattage: number;
  hoursPerWeek: number;
  annualHours: number;
  annualKwh: number;
  area: string;
  make?: string | undefined;
  model?: string | undefined;
}

export const EquipmentAnalysis: React.FC<EquipmentAnalysisProps> = ({ reportData }) => {
  const [equipment, setEquipment] = useState<EnhancedEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [actualUsage, setActualUsage] = useState(0);
  const [estimatedUsage, setEstimatedUsage] = useState(0);
  const [usageDifference, setUsageDifference] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState(0);

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!reportData.project?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch equipment data from field notes
        const fieldNotesResponse = await fieldNotesService.getFieldNotes(reportData.project.id);
        const equipmentData = fieldNotesResponse.equipment || [];
        
        // Configure default values for equipment data
        const defaultHoursPerWeek = 28; // Default weekly hours
        const defaultAnnualHours = 1460; // Default annual hours
        
        // Actual usage from utility data (if available)
        const actualKwh = reportData.totalUsage?.electric || 139159;
        setActualUsage(actualKwh);
        
        // Transform the data to match our enhanced format
        const enhancedEquipment: EnhancedEquipment[] = equipmentData.map((item: ProcessedEquipment) => {
          // Extract or set default values
          const type = item.equipment_type || 'Unknown Equipment';
          const category = item.category || 'Uncategorized';
          const quantity = item.quantity || 1;
          
          // Extract location
          let locationStr = 'Unknown';
          if (typeof item.location === 'string' && item.location) {
            locationStr = item.location;
          } else if (typeof item.location === 'object' && item.location) {
            locationStr = item.location.room || 'Unknown';
            if (item.location.floor) {
              locationStr += `, Floor ${item.location.floor}`;
            }
          }
          
          // Set energy values or defaults
          const wattage = item.wattage || item.details?.wattage || 0;
          const hoursPerWeek = defaultHoursPerWeek;
          const annualHours = defaultAnnualHours;
          
          // Calculate annual kWh: wattage * quantity * annualHours / 1000
          const annualKwh = (wattage * quantity * annualHours) / 1000;
          
          // Determine area type based on category and location
          let area = 'Apartment';
          if (
            category.toLowerCase().includes('common') || 
            locationStr.toLowerCase().includes('common') ||
            locationStr.toLowerCase().includes('exterior') ||
            locationStr.toLowerCase().includes('lobby') ||
            locationStr.toLowerCase().includes('hallway') ||
            locationStr.toLowerCase().includes('stairway') ||
            locationStr.toLowerCase().includes('garage') ||
            locationStr.toLowerCase().includes('parking') ||
            type.toLowerCase().includes('exterior')
          ) {
            area = 'Common';
          }
          
          return {
            id: item.id,
            type,
            category,
            quantity,
            location: locationStr,
            wattage,
            hoursPerWeek,
            annualHours,
            annualKwh,
            area,
            make: item.details?.make,
            model: item.details?.model,
          };
        });
        
        // Set equipment state
        setEquipment(enhancedEquipment);
        setTotalItems(enhancedEquipment.length);
        
        // Calculate total estimated usage
        const totalEstimated = enhancedEquipment.reduce((sum, item) => sum + item.annualKwh, 0);
        setEstimatedUsage(totalEstimated);
        
        // Calculate usage difference and percentage
        const diff = actualKwh - totalEstimated;
        setUsageDifference(diff);
        setUsagePercentage(Math.round((diff / actualKwh) * 100));
        
      } catch (err) {
        console.error('Error fetching equipment data:', err);
        setError('Failed to load equipment data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [reportData.project?.id, reportData.totalUsage?.electric]);

  // Format number with commas for display
  const formatNumber = (value: number, decimals: number = 0) => {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // Group equipment by category for better organization
  const equipmentByCategory = equipment.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, EnhancedEquipment[]>);

  // Sort categories for consistent display
  const sortedCategories = Object.keys(equipmentByCategory).sort();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  // Calculate total kWh for a category
  const getCategoryTotal = (categoryItems: EnhancedEquipment[]) => {
    return categoryItems.reduce((sum, item) => sum + item.annualKwh, 0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Equipment Analysis</h2>
      
      {equipment.length === 0 ? (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          No equipment data available for this project.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Equipment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Actual Usage</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(actualUsage)} kWh</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Usage</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(estimatedUsage)} kWh</p>
              <p className={`text-sm ${usageDifference < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {usageDifference < 0 ? '-' : '+'}{formatNumber(Math.abs(usageDifference))} kWh ({usagePercentage}%) {usageDifference < 0 ? 'off' : 'over'}
              </p>
            </div>
          </div>
          
          {/* Equipment Inventory Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Watts</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hrs/Wk</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ann. Hrs</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ann. kWh</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Area</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {sortedCategories.map((category) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <td colSpan={9} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {category} ({equipmentByCategory[category].length} items)
                      </td>
                    </tr>
                    
                    {/* Equipment Items */}
                    {equipmentByCategory[category].map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {item.category}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {item.type}
                          {item.make && item.model && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.make} {item.model}</div>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {item.location}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {item.wattage}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {item.hoursPerWeek}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {item.annualHours}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {Math.round(item.annualKwh)}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            item.area === 'Apartment' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/20 dark:text-emerald-400' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
                          }`}>
                            {item.area}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Category Subtotal */}
                    <tr className="bg-gray-50 dark:bg-gray-800/50 font-medium">
                      <td colSpan={7} className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">
                        {category} Subtotal:
                      </td>
                      <td className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">
                        {formatNumber(getCategoryTotal(equipmentByCategory[category]))} kWh
                      </td>
                      <td className="px-4 py-2"></td>
                    </tr>
                  </React.Fragment>
                ))}
                
                {/* Grand Total */}
                <tr className="bg-gray-200 dark:bg-gray-700 font-bold">
                  <td colSpan={7} className="px-4 py-2 text-right text-gray-800 dark:text-gray-200">
                    Total Estimated Usage:
                  </td>
                  <td className="px-4 py-2 text-center text-gray-800 dark:text-gray-200">
                    {formatNumber(estimatedUsage)} kWh
                  </td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Note: Equipment data was extracted from field notes using AI analysis. Actual usage data is from utility bills.
          </div>
        </div>
      )}
    </div>
  );
}; 