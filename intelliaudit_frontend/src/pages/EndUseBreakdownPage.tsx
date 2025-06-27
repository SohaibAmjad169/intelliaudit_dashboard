import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
// Import all end-use breakdown components
import { EnergyBreakdownSection } from '../components/energy-analysis/components/EnergyBreakdownSection';
import { EnhancedEnergyBreakdownTable } from '../components/energy-analysis/components/EnhancedEnergyBreakdownTable';
import { CombinedFuelEndUseChart } from '../components/energy-analysis/components/CombinedFuelEndUseChart';
import { CombinedKbtuEndUseChart } from '../components/energy-analysis/components/CombinedKbtuEndUseChart';
import { EndUseByTypeTable } from '../components/energy-analysis/components/EndUseByTypeTable';
import { KwhEndUseChart } from '../components/energy-analysis/components/KwhEndUseChart';
import { ThermsEndUseChart } from '../components/energy-analysis/components/ThermsEndUseChart';

// Import types and services
import { 
  CombinedEndUseData, 
  ConversionFactors,
  EnergyBreakdown,
  EnhancedTableData,
  EquipmentItem
} from '../components/energy-analysis/types/energyAnalysis.types';
import { energyAnalysisService, CONVERSION_FACTORS } from '../components/energy-analysis/services/energyAnalysis.service';
import { apiClient } from '@/services/common/api-client';

// Define our own EndUseItem interface since it's not exported from the types file
interface EndUseItem {
  name: string;
  kWh: number;
  therms: number;
}

// Define interfaces for API responses based on the actual network response
interface EndUseComponentData {
  name: string;
  electricKwh: number;
  gasTherms: number;
  electricPercent: number;
  gasPercent: number;
  steamMMBtu?: number;
  otherMMBtu?: number;
  steamPercent?: number;
  otherPercent?: number;
}

interface EnergyBreakdownResponse {
  // The original interface fields
  id?: string;
  project_id?: string;
  building_id?: string;
  building_type_code?: string;
  end_use_breakdown?: Record<string, number>;
  original_default_breakdown?: Record<string, number>;
  
  // Fields from the network response
  endUseComponents?: EndUseComponentData[];
  totalActualElectric?: number;
  totalActualGas?: number;
  totalActualSteam?: number;
  totalActualOther?: number;
}

interface UtilityUsageResponse {
  // Original fields
  usageByType?: Record<string, { total: number, units: string }>;
  totalElectric?: number;
  naturalGasUsage?: number;
  naturalGasInKWh?: number;
  totalEnergyUsage?: number;
  
  // Additional fields that might be in the response
  totalActualElectric?: number;
  totalActualGas?: number;
}

const EndUseBreakdownPage: React.FC = () => {
  // Get projectId from route params
  const { projectId } = useParams<{ projectId: string }>();
  
  // State for the data
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [endUseData, setEndUseData] = useState<CombinedEndUseData[]>([]);
  const [energyBreakdown, setEnergyBreakdown] = useState<EnergyBreakdown | null>(null);
  const [enhancedTableData, setEnhancedTableData] = useState<EnhancedTableData[]>([]);
  const [endUseItems, setEndUseItems] = useState<EndUseItem[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [totalEstimatedElectric, setTotalEstimatedElectric] = useState<number>(0);
  const [totalEstimatedGas, setTotalEstimatedGas] = useState<number>(0);
  const [totalActualElectric, setTotalActualElectric] = useState<number>(0);
  const [totalActualGas, setTotalActualGas] = useState<number>(0);
  
  // Use the conversion factors from the service
  const conversionFactors: ConversionFactors = {
    kWhTokBtu: CONVERSION_FACTORS.kWhTokBtu,
    thermsTokBtu: CONVERSION_FACTORS.thermsTokBtu
  };
  
  // Handle adjustment changes
  const handleAdjustmentChange = (category: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!projectId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch energy breakdown data from the correct endpoint
        console.log('Fetching energy breakdown data from:', `field-notes/${projectId}/energy-breakdown`);
        const breakdownResponse = await apiClient.get<EnergyBreakdownResponse>(`field-notes/${projectId}/energy-breakdown`);
        console.log('Energy breakdown response:', breakdownResponse);
        
        // Fetch utility usage data
        console.log('Fetching utility usage data from:', `utility-calcs/projects/${projectId}/total-usage`);
        const utilityResponse = await apiClient.get<UtilityUsageResponse>(`utility-calcs/projects/${projectId}/total-usage`);
        console.log('Utility usage response:', utilityResponse);
        
        // Try to fetch equipment data
        let equipmentData: EquipmentItem[] = [];
        try {
          // Try to get equipment data from field-notes endpoint
          const fieldNotesResponse = await apiClient.get<any>(`field-notes/${projectId}`);
          if (fieldNotesResponse && fieldNotesResponse.equipment) {
            equipmentData = fieldNotesResponse.equipment;
          }
        } catch (equipErr) {
          console.warn('Could not load equipment data, continuing without it:', equipErr);
        }
        
        // Process the data
        // Check if the response has the expected structure
        console.log('Checking response structure');
        if (breakdownResponse && utilityResponse) {
          // Debug the structure of the responses
          console.log('Response structures valid');
          console.log('Breakdown response keys:', Object.keys(breakdownResponse));
          console.log('Utility response keys:', Object.keys(utilityResponse));
          // Set equipment data
          setEquipment(equipmentData);
          
          // Process energy breakdown data - handle different possible response formats
          let endUseBreakdown = {};
          
          // Check if the response has endUseComponents (from the network tab)
          if (breakdownResponse.endUseComponents) {
            console.log('Found endUseComponents in response');
            // Format from the network tab
            endUseBreakdown = breakdownResponse.endUseComponents.reduce((acc, item) => {
              const name = item.name.toLowerCase().replace(/ /g, '_');
              acc[name] = item.electricPercent || 0;
              return acc;
            }, {} as Record<string, number>);
          } 
          // Check if it has end_use_breakdown (from our interface)
          else if (breakdownResponse.end_use_breakdown) {
            console.log('Found end_use_breakdown in response');
            endUseBreakdown = breakdownResponse.end_use_breakdown;
          }
          // If neither is found, try to use the response directly if it has the right shape
          else if (typeof breakdownResponse === 'object') {
            console.log('Using response directly');
            // Try to find any property that looks like a breakdown
            for (const key of Object.keys(breakdownResponse)) {
              if (typeof breakdownResponse[key] === 'object' && breakdownResponse[key] !== null) {
                console.log('Found potential breakdown object in key:', key);
                endUseBreakdown = breakdownResponse[key];
                break;
              }
            }
          }
          
          console.log('Processed end use breakdown:', endUseBreakdown);
          
          // Create formatted data for charts
          const categories = Object.keys(endUseBreakdown);
          console.log('Categories found:', categories);
          
          // Handle different utility response formats
          let totalElectric = 0;
          let totalGas = 0;
          
          if (utilityResponse.totalElectric !== undefined) {
            totalElectric = utilityResponse.totalElectric;
          } else if (utilityResponse.totalActualElectric !== undefined) {
            totalElectric = utilityResponse.totalActualElectric;
          } else if (utilityResponse.usageByType && utilityResponse.usageByType.Electric) {
            totalElectric = utilityResponse.usageByType.Electric.total || 0;
          }
          
          if (utilityResponse.naturalGasUsage !== undefined) {
            totalGas = utilityResponse.naturalGasUsage;
          } else if (utilityResponse.totalActualGas !== undefined) {
            totalGas = utilityResponse.totalActualGas;
          } else if (utilityResponse.usageByType && utilityResponse.usageByType['Natural Gas']) {
            totalGas = utilityResponse.usageByType['Natural Gas'].total || 0;
          }
          
          console.log('Total electric:', totalElectric);
          console.log('Total gas:', totalGas);
          
          // Create combined end use data
          const formattedData: CombinedEndUseData[] = categories.map(category => {
            const percentage = endUseBreakdown[category] || 0;
            const kWh = (percentage / 100) * totalElectric;
            const therms = (percentage / 100) * totalGas;
            
            return {
              name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              kWh: kWh,
              therms: therms,
              kBtu: (kWh * CONVERSION_FACTORS.kWhTokBtu) + (therms * CONVERSION_FACTORS.thermsTokBtu)
            };
          });
          
          setEndUseData(formattedData);
          
          // Create end use items
          const items: EndUseItem[] = formattedData.map(item => ({
            name: item.name,
            kWh: item.kWh || 0,
            therms: item.therms || 0
          }));
          setEndUseItems(items);
          
          // Create enhanced table data
          const tableData: EnhancedTableData[] = categories.map(category => {
            const percentage = endUseBreakdown[category] || 0;
            const electricKwh = (percentage / 100) * totalElectric;
            const gasTherm = (percentage / 100) * totalGas;
            
            return {
              name: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              electricKwh,
              gasTherm,
              electricPercent: percentage,
              gasPercent: percentage, // Using same percentage for now
              electricCost: electricKwh * 0.12, // Assuming $0.12/kWh
              gasCost: gasTherm * 1.20, // Assuming $1.20/therm
              kBtu: (electricKwh * CONVERSION_FACTORS.kWhTokBtu) + (gasTherm * CONVERSION_FACTORS.thermsTokBtu)
            };
          });
          setEnhancedTableData(tableData);
          
          // Set totals from utility data
          setTotalEstimatedElectric(totalElectric);
          setTotalEstimatedGas(totalGas);
          setTotalActualElectric(totalElectric);
          setTotalActualGas(totalGas);
          
          // Initialize adjustments
          const initialAdjustments: Record<string, number> = {};
          categories.forEach(category => {
            initialAdjustments[category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())] = 100; // Start at 100%
          });
          setAdjustments(initialAdjustments);
          
          // Create an energy breakdown object for the EnergyBreakdownSection
          const energyBreakdownObj: EnergyBreakdown = {
            categories: categories.reduce((acc, category) => {
              acc[category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())] = {
                kWh: (endUseBreakdown[category] / 100) * totalElectric,
                percentage: endUseBreakdown[category],
                adjustmentFactor: 1
              };
              return acc;
            }, {} as Record<string, { kWh: number; percentage: number; adjustmentFactor: number }>),
            total: {
              estimated: totalElectric,
              actual: totalElectric,
              difference: 0,
              differencePercentage: 0
            }
          };
          setEnergyBreakdown(energyBreakdownObj);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load energy data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [projectId]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Spinner className="w-8 h-8 mb-4" />
        <div>Loading energy data...</div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h2 className="text-lg font-semibold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  // If no data is available
  if (endUseData.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
        <h2 className="text-lg font-semibold">No Data Available</h2>
        <p>There is no energy breakdown data available for this project.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold mb-4">End-Use Breakdown for Project {projectId}</h1>
      
      {energyBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Energy Breakdown Section</CardTitle>
          </CardHeader>
          <CardContent>
            <EnergyBreakdownSection 
              energyBreakdown={energyBreakdown} 
              adjustments={adjustments} 
              onAdjustmentChange={handleAdjustmentChange} 
            />
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Enhanced Energy Breakdown Table</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedEnergyBreakdownTable 
            data={enhancedTableData}
            equipment={equipment}
            totalEstimatedElectric={totalEstimatedElectric}
            totalEstimatedGas={totalEstimatedGas}
            totalActualElectric={totalActualElectric}
            totalActualGas={totalActualGas}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Combined Fuel End-Use Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <CombinedFuelEndUseChart data={endUseData} conversionFactors={conversionFactors} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Combined kBtu End-Use Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <CombinedKbtuEndUseChart data={endUseData} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>End Use By Type Table</CardTitle>
        </CardHeader>
        <CardContent>
          <EndUseByTypeTable data={endUseItems} title="End Use By Type" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>kWh End-Use Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <KwhEndUseChart data={endUseData} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Therms End-Use Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ThermsEndUseChart data={endUseData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EndUseBreakdownPage;
