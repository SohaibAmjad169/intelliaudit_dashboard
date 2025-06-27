import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BuildingInformationCard } from '../components/BuildingInformationCard';
import { EnergyBreakdownSection } from '../components/EnergyBreakdownSection';
import { EquipmentCategoriesTable } from '../components/EquipmentCategoriesTable';
import { AssumptionsPanel } from '../components/AssumptionsPanel';
import { UtilityComparisonCard } from '../components/UtilityComparisonCard';
import { EnhancedEnergyBreakdownTable } from '../components/EnhancedEnergyBreakdownTable';
import { CombinedEnergyUseTable } from '../components/CombinedEnergyUseTable';
import { EndUseByTypeTable } from '../components/EndUseByTypeTable';
import { EnergyPieChartDashboard } from '../components/EnergyPieChartDashboard';
import { Loader2, Download, Save, RefreshCw, ChevronLeft } from 'lucide-react';
import { energyAnalysisService, EnergyBreakdownResponse } from '../services/energyAnalysis.service';
import { transformApiDataToEnhancedTable } from '../utils/transformData';
import { fetchTotalUtilityUsage } from '@/services/energy-analysis';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConversionFactors } from '../types/energyAnalysis.types';

// Types
import { EnergyAnalysisData, CombinedEndUseData, EquipmentItem, EnhancedTableData } from '../types/energyAnalysis.types';
import { STANDARD_END_USE_CATEGORIES } from '../services/energyAnalysis.service';
import axiosInstance from '@/services/common/axios-config';

// Constants for energy calculations
const KWH_TO_KBTU = 3.412;
const THERM_TO_KBTU = 100;
const ELECTRIC_RATE = 0.18; // $0.15 per kWh
const GAS_RATE = 1.05; // $1.50 per therm

const conversionFactors: ConversionFactors = {
  kWhTokBtu: 3.412,
  thermsTokBtu: 100
};

// Default breakdowns for different building types (example)
const DEFAULT_BREAKDOWNS: Record<string, Record<string, { electricPercent?: number; gasPercent?: number }>> = {
  multifamily: {
    Lighting: { electricPercent: 12, gasPercent: 0 },
    Refrigeration: { electricPercent: 8, gasPercent: 0 },
    Heating: { electricPercent: 5, gasPercent: 35 },
    Cooling: { electricPercent: 18, gasPercent: 0 },
    Ventilation: { electricPercent: 7, gasPercent: 0 },
    'Water Heating': { electricPercent: 3, gasPercent: 25 },
    Cooking: { electricPercent: 4, gasPercent: 10 },
    Laundry: { electricPercent: 5, gasPercent: 5 },
    'Office Equipment': { electricPercent: 2, gasPercent: 0 },
    Elevator: { electricPercent: 3, gasPercent: 0 },
    'Motors/Pumps': { electricPercent: 8, gasPercent: 0 },
    Other: { electricPercent: 15, gasPercent: 25 }, // Increased "Other" to accommodate remaining percentages
  },
  office: {
    Lighting: { electricPercent: 25, gasPercent: 0 },
    Heating: { electricPercent: 2, gasPercent: 30 },
    Cooling: { electricPercent: 28, gasPercent: 0 },
    Ventilation: { electricPercent: 15, gasPercent: 0 },
    'Water Heating': { electricPercent: 1, gasPercent: 5 },
    'Office Equipment': { electricPercent: 15, gasPercent: 0 },
    Elevator: { electricPercent: 3, gasPercent: 0 },
    'Motors/Pumps': { electricPercent: 6, gasPercent: 0 },
    Other: { electricPercent: 5, gasPercent: 65 },
  },
  // Add other building types as needed
  default: { // Fallback if building type is not matched
    Other: { electricPercent: 100, gasPercent: 100 }, // Simple fallback
  }
};

interface EnergyAnalysisProps {
  publicView?: boolean;
}

const EnergyAnalysisPage: React.FC<EnergyAnalysisProps> = ({ publicView }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<EnergyAnalysisData>({
    projectId: projectId || '',
    projectName: '',
    equipment: [],
    buildingInfo: {
      totalUnits: 0,
      unitTypes: {
        twoBedroom: 0,
        oneBedroom: 0,
        studio: 0,
      },
      occupancyRate: 0,
      buildingType: '',
      floors: 0,
      constructionYear: 0,
      location: '', // Added for project metadata
    },
    energyBreakdown: {
      categories: {},
      total: {
        estimated: 0,
        actual: 0,
        difference: 0,
        differencePercentage: 0
      }
    },
    assumptions: {},
    lastUpdated: new Date().toISOString()
  });
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [showLegacyComponents, setShowLegacyComponents] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'table' | 'charts' | 'equipment'>('table');
  const [endUseData, setEndUseData] = useState<CombinedEndUseData[]>([]);
  const [enhancedTableData, setEnhancedTableData] = useState<EnhancedTableData[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [actualUtilityData, setActualUtilityData] = useState({
    totalElectric: 0,
    totalGas: 0
  });
  const [totalEnergy, setTotalEnergy] = useState({
    totalElectric: 0,
    totalGas: 0,
    totalKbtu: 0
  });

  // Fetch actual utility usage data
  useEffect(() => {
    const fetchActualUtilityData = async () => {
      if (!projectId) return;
      
      try {
        const usageData = await fetchTotalUtilityUsage(projectId);
        if (usageData) {
          setActualUtilityData({
            totalElectric: usageData.totalElectric || 0,
            totalGas: usageData.naturalGasUsage || 0
          });
          console.log('Loaded actual utility data:', usageData);
        }
      } catch (error) {
        console.error('Failed to load actual utility data:', error);
      }
    };
    
    fetchActualUtilityData();
  }, [projectId]);

  // Fetch field notes data directly instead of energy breakdown
  useEffect(() => {
    const fetchFieldNotesData = async () => {
      if (!projectId) return;
      
      setIsLoading(true);
      try {
        // Fetch field notes data directly
        const response = await axiosInstance.get(`/api/field-notes/${projectId}`);
        const fieldNotesData = response.data;
        
        // Extract equipment from field notes
        // Also extract building info if available in fieldNotesData
        if (fieldNotesData.building_info) {
          setData(prev => ({ ...prev, buildingInfo: { ...prev.buildingInfo, ...fieldNotesData.building_info }}));
        }

        const equipmentItems = fieldNotesData.equipment || [];
        setEquipment(equipmentItems);
        
        // Process equipment data for energy analysis
        processEquipmentData(equipmentItems);
        
        console.log('Updated with field notes data');
      } catch (error) {
        console.error('Failed to fetch field notes data:', error);
        // Fallback to empty data if API fails
        console.log('Using empty data as fallback');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFieldNotesData();
  }, [projectId]);

  // Process equipment data to generate energy use breakdown
  const processEquipmentData = (equipmentItems: EquipmentItem[]) => {
    // Map to track energy use by category
    const categoryMap = new Map<string, { kWh: number, therms: number }>();
    const activeCategories = new Set<string>(); // To track categories with actual equipment
    
    // Ensure all standard categories are initialized with zero values
    STANDARD_END_USE_CATEGORIES.forEach(category => {
      categoryMap.set(category, { kWh: 0, therms: 0 });
    });
    
    // Determine the building type for baseline comparison
    const buildingTypeKey = data.buildingInfo?.buildingType?.toLowerCase() || 'default';
    const currentBaseline = DEFAULT_BREAKDOWNS[buildingTypeKey] || DEFAULT_BREAKDOWNS.default;

    console.log(`Processing ${equipmentItems.length} equipment items`);
    
    // Process each equipment item
    equipmentItems.forEach(item => {
      // Use the end_use_category from the equipment item if available, otherwise determine it
      const endUseCategory = item.end_use_category || mapEquipmentToCategory(item.equipment_type, item.category);
      
      // Skip if no valid category
      if (!endUseCategory) return;

      if (item.annual_kwh || item.annual_therms || item.wattage || item.capacity) {
        activeCategories.add(endUseCategory);
      }
      
      // Get current totals for this category
      const current = categoryMap.get(endUseCategory) || { kWh: 0, therms: 0 };
      
      // Determine energy usage
      let electricKwh = 0;
      let gasTherms = 0;
      
      // Calculate electric usage - use annual_kwh if available, otherwise calculate from wattage and hours
      if (item.energy_source === 'electricity' || !isGasEquipment(item)) {
        if (item.annual_kwh) {
          // Use pre-calculated annual kWh
          electricKwh = item.annual_kwh;
        } else if (item.wattage && item.annual_hours) {
          // Calculate from wattage and hours
          electricKwh = (item.wattage * item.annual_hours * (item.quantity || 1)) / 1000;
        } else if (item.wattage && item.weekly_hours) { // Added weekly_hours check
          const annualHoursFromWeekly = Number(item.weekly_hours) * 52.14;
          electricKwh = (item.wattage * annualHoursFromWeekly * (item.quantity || 1)) / 1000;
        }
         else if (item.wattage) {
          // Estimate hours based on equipment type
          const hours = estimateAnnualHours(item);
          electricKwh = (item.wattage * hours * (item.quantity || 1)) / 1000;
        } else if (endUseCategory === "Cooling") {
          // Default estimate for cooling equipment without energy data
          // Make it slightly more varied based on capacity if available
          const capacityFactor = item.capacity && typeof item.capacity === 'number' ? item.capacity / 12000 : 1; // Assuming capacity is BTU/hr
          electricKwh = (500 + Math.random() * 100 - 50) * capacityFactor * (item.quantity || 1);
        } else if (endUseCategory === "Cooking") {
          // Default estimate for electric cooking equipment
          const capacityFactor = item.capacity && typeof item.capacity === 'number' ? item.capacity / 5000 : 1; // Assuming capacity is Watts
          electricKwh = (700 + Math.random() * 100 - 50) * capacityFactor * (item.quantity || 1);
        } else if (endUseCategory === "Refrigeration") { // Added Refrigeration
          const capacityFactor = item.capacity && typeof item.capacity === 'string' && item.capacity.toLowerCase().includes('cu ft') ? parseFloat(item.capacity) / 20 : 1;
          electricKwh = (600 + Math.random() * 100 - 50) * capacityFactor * (item.quantity || 1); // Average fridge/freezer
        } else if (endUseCategory === "Office Equipment") {
          // Default estimate for office equipment
          electricKwh = 300 * (item.quantity || 1);
        } else if (endUseCategory === "Pool/Spa") {
          // Default for pool/spa equipment
          electricKwh = 2500; // Rough estimate for a pool pump
        }
      }
      
      // Calculate gas usage for gas equipment
      if (item.energy_source === 'natural gas' || isGasEquipment(item)) {
        if (item.capacity && typeof item.capacity === 'number') {
          // Estimate annual therms based on capacity and typical usage factor
          gasTherms = estimateAnnualTherms(item) * (item.quantity || 1); // Multiply by quantity
        } else if (item.annual_therms) { // Added check for annual_therms
          gasTherms = item.annual_therms * (item.quantity || 1);
        } else if (endUseCategory === "Heating") {
          // Default estimate for heating equipment
          const capacityFactor = item.capacity && typeof item.capacity === 'number' ? item.capacity / 80000 : 1; // Assuming capacity is BTU/hr
          gasTherms = (100 + Math.random() * 20 - 10) * capacityFactor * (item.quantity || 1);
        } else if (endUseCategory === "Water Heating") {
          // Default estimate for water heating
          const capacityFactor = item.capacity && typeof item.capacity === 'number' ? item.capacity / 40000 : 1; // Assuming capacity is BTU/hr
          gasTherms = (200 + Math.random() * 40 - 20) * capacityFactor * (item.quantity || 1);
        } else if (endUseCategory === "Cooking" && isGasEquipment(item)) {
          // Default estimate for gas cooking equipment
          const capacityFactor = item.capacity && typeof item.capacity === 'number' ? item.capacity / 60000 : 1; // Assuming capacity is BTU/hr
          gasTherms = (40 + Math.random() * 10 - 5) * capacityFactor * (item.quantity || 1);
        } else if (endUseCategory === "Laundry" && item.equipment_type.toLowerCase().includes('dryer')) {
          // Default for gas dryers
          gasTherms = 25 * (item.quantity || 1);
        }
      }
      
      console.log(`Item: ${item.equipment_type}, Category: ${endUseCategory}, Electric: ${electricKwh.toFixed(1)} kWh, Gas: ${gasTherms.toFixed(1)} therms`);
      
      // Update totals
      current.kWh += electricKwh;
      current.therms += gasTherms;
      
      // Update the category map
      categoryMap.set(endUseCategory, current);
    });
    
    // Calculate totals
    let totalElectric = 0;
    let totalGas = 0;
    
    categoryMap.forEach(value => {
      totalElectric += value.kWh;
      totalGas += value.therms;
    });
    
    console.log(`Total Electric: ${totalElectric.toFixed(1)} kWh, Total Gas: ${totalGas.toFixed(1)} therms`);
    
    // Convert to arrays for charts and tables
    const endUseArray: CombinedEndUseData[] = [];
    const enhancedTableArray: EnhancedTableData[] = [];
    
    // Create data arrays for charts and tables, including ALL categories
    STANDARD_END_USE_CATEGORIES.forEach(category => {
      const value = categoryMap.get(category) || { kWh: 0, therms: 0 };
      const standardCategoryData = currentBaseline[category] || {};

      // Include category if it has actual data or is part of the building type's standard breakdown
      if (activeCategories.has(category) || value.kWh > 0 || value.therms > 0 || 
          (standardCategoryData.electricPercent && standardCategoryData.electricPercent > 0) ||
          (standardCategoryData.gasPercent && standardCategoryData.gasPercent > 0)) {

        const kBtuElectric = value.kWh * KWH_TO_KBTU;
        const kBtuGas = value.therms * THERM_TO_KBTU;
        const kBtu = kBtuElectric + kBtuGas;
        
        const electricPercent = totalElectric > 0 ? (value.kWh / totalElectric) * 100 : 0;
        const gasPercent = totalGas > 0 ? (value.therms / totalGas) * 100 : 0;
        
        endUseArray.push({
          name: category,
          kWh: value.kWh > 0 ? value.kWh : null,
          therms: value.therms > 0 ? value.therms : null,
          kBtu: kBtu > 0 ? kBtu : null
        });
        
        enhancedTableArray.push({
          name: category,
          electricKwh: value.kWh,
          gasTherm: value.therms,
          electricPercent: electricPercent,
          gasPercent: gasPercent,
          standardElectricPercent: standardCategoryData.electricPercent, // Add standard %
          standardGasPercent: standardCategoryData.gasPercent,       // Add standard %
          electricCost: value.kWh * ELECTRIC_RATE,
          gasCost: value.therms * GAS_RATE,
          kBtu: kBtu
        });
      
        console.log(`Category: ${category}, Electric: ${value.kWh.toFixed(1)} kWh (${electricPercent.toFixed(1)}%), Gas: ${value.therms.toFixed(1)} therms (${gasPercent.toFixed(1)}%)`);
      }
    });
    
    // Calculate total kBtu
    const totalKbtu = (totalElectric * KWH_TO_KBTU) + (totalGas * THERM_TO_KBTU);
    console.log(`Total kBtu: ${totalKbtu.toFixed(1)}`);
    
    // Update state
    setEndUseData(endUseArray);
    setEnhancedTableData(enhancedTableArray);
    setTotalEnergy({
      totalElectric,
      totalGas,
      totalKbtu
    });
  };
  
  // Estimate annual hours based on equipment type
  const estimateAnnualHours = (item: EquipmentItem): number => {
    const equipmentType = item.equipment_type.toLowerCase();
    const location = typeof item.location === 'string' ? item.location.toLowerCase() : '';
    
    // Exterior lighting
    if (equipmentType.includes('light') && 
        (location.includes('exterior') || location.includes('outdoor'))) {
      return 4380; // 12 hours/day
    }
    
    // Interior common area lighting
    if (equipmentType.includes('light') && 
        (location.includes('hallway') || location.includes('lobby') || location.includes('common'))) {
      return 6570; // 18 hours/day
    }
    
    // Interior unit lighting
    if (equipmentType.includes('light')) {
      return 1460; // 4 hours/day
    }
    
    // Cooling equipment
    if (equipmentType.includes('air conditioner') || 
        equipmentType.includes('ac') || 
        equipmentType.includes('ptac')) {
      return 1000; // ~3 hours/day during cooling months
    }
    
    // Heating equipment
    if (equipmentType.includes('furnace') || 
        equipmentType.includes('heat')) {
      return 1200; // ~4 hours/day during heating months
    }
    
    // Refrigeration
    if (equipmentType.includes('refrigerator') || 
        equipmentType.includes('fridge')) {
      return 8760; // 24 hours/day but cycling (factored into wattage)
    }
    
    // Default for other equipment
    return 1460; // 4 hours/day as a default
  };
  
  // Helper function to map equipment type to energy end-use category
  const mapEquipmentToCategory = (equipmentType: string, category?: string): string => {
    // First check if category is already a standard category
    if (category && STANDARD_END_USE_CATEGORIES.includes(category)) {
      return category;
    }
    
    // Map equipment types to standard categories
    const typeToCategory: Record<string, string> = {
      'air conditioner': 'Cooling',
      'chiller': 'Cooling',
      'fan': 'Ventilation',
      'furnace': 'Heating',
      'boiler': 'Heating',
      'heat pump': 'Heating',
      'electric heater': 'Heating',
      'lighting': 'Lighting',
      'lamp': 'Lighting',
      'bulb': 'Lighting',
      'led': 'Lighting',
      'cfl': 'Lighting',
      'elevator': 'Elevator',
      'escalator': 'Elevator',
      'refrigerator': 'Refrigeration',
      'freezer': 'Refrigeration',
      'pump': 'Motors/Pumps',
      'motor': 'Motors/Pumps',
      'computer': 'Office Equipment',
      'laptop': 'Office Equipment',
      'printer': 'Office Equipment',
      'water heater': 'Water Heating', // Ensure mapping consistency
      'washer': 'Laundry',
      'dryer': 'Laundry',
      'cooking': 'Cooking',
      'stove': 'Cooking',
      'oven': 'Cooking',
      'microwave': 'Cooking',
      'compressor': 'Air Compressors',
      'pool': 'Pool/Spa',
      'spa': 'Pool/Spa',
      'hot tub': 'Pool/Spa',
      'exhaust': 'Ventilation',
      'process': 'Process'
    };
    
    // Convert equipment type to lowercase for case-insensitive matching
    const lowerType = equipmentType.toLowerCase();
    
    // Try to find a matching category
    for (const [key, value] of Object.entries(typeToCategory)) {
      if (lowerType.includes(key)) {
        return value;
      }
    }
    
    // If no match, return "Other"
    return 'Other';
  };
  
  // Helper function to determine if equipment uses gas
  const isGasEquipment = (item: EquipmentItem): boolean => {
    const gasEquipmentTypes = [
      'furnace', 'boiler', 'water heater', 'stove', 'oven', 'cooking', 'pool heater', 'gas dryer'
    ];
    
    // Check if energy_source explicitly states "natural gas" or "gas"
    if (item.energy_source && 
        (item.energy_source.toLowerCase().includes('gas') || 
         item.energy_source.toLowerCase().includes('natural'))) {
      return true;
    }
    
    // Check equipment type
    const lowerType = item.equipment_type.toLowerCase();
    return gasEquipmentTypes.some(type => lowerType.includes(type));
  };
  
  // Helper function to estimate annual therms based on equipment capacity
  const estimateAnnualTherms = (item: EquipmentItem): number => {
    // Default usage factors by equipment type
    const usageFactors: Record<string, number> = {
      'furnace': 500, // Hours per year x efficiency factor
      'boiler': 800,
      'water heater': 300,
      'cooking': 200,
      'pool heater': 400,
      'gas dryer': 150
    };
    
    const lowerType = item.equipment_type.toLowerCase();
    let usageFactor = 300; // Default
    
    // Find matching usage factor
    for (const [key, value] of Object.entries(usageFactors)) {
      if (lowerType.includes(key)) {
        usageFactor = value;
        break;
      }
    }
    
    // Calculate estimated annual therms
    // Capacity might be stored as string or number
    const capacity = typeof item.capacity === 'string'
      ? parseFloat(item.capacity) 
      : (item.capacity || 0);
      
    return capacity * usageFactor / 100000; // Convert to therms with typical efficiency
  };

  const handleAdjustmentChange = (category: string, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSaveAdjustments = () => {
    // In a real implementation, this would save adjustments to the API
    console.log('Saving adjustments:', adjustments);
  };

  const handleExportData = () => {
    // In a real implementation, this would export data to CSV or PDF
    console.log('Exporting data');
  };

  const handleRefreshData = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      // Fetch fresh field notes data
      const [fieldNotesResponse, usageData] = await Promise.all([
        axiosInstance.get(`/api/field-notes/${projectId}`),
        fetchTotalUtilityUsage(projectId)
      ]);
      
      const fieldNotesData = fieldNotesResponse.data;
      const equipmentItems = fieldNotesData.equipment || [];
      
      // Update equipment data
      setEquipment(equipmentItems);
      
      // Process equipment data
      processEquipmentData(equipmentItems);
      
      // Update actual utility data
      if (usageData) {
        setActualUtilityData({
          totalElectric: usageData.totalElectric || 0,
          totalGas: usageData.naturalGasUsage || 0
        });
      }
      
      console.log('Refreshed energy analysis data from field notes');
    } catch (error) {
      console.error('Failed to refresh energy analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-lg">Loading energy analysis...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Project
          </Button>
          <h1 className="text-2xl font-bold">Energy Analysis</h1>
          {data.projectName && (
            <span className="ml-2 text-muted-foreground">
              {data.projectName}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'table' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setActiveTab('table')}
            className="mr-2"
          >
            Table View
          </Button>
          <Button 
            variant={activeTab === 'charts' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setActiveTab('charts')}
            className="mr-2"
          >
            Charts
          </Button>
          <Button 
            variant={activeTab === 'equipment' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setActiveTab('equipment')}
            className="mr-4"
          >
            Equipment
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          {!publicView && (
          <Button size="sm" onClick={handleSaveAdjustments}>
            <Save className="w-4 h-4 mr-1" />
            Save Adjustments
          </Button>
          )}
        </div>
      </div>

      {activeTab === 'table' && (
        <>
          {/* Enhanced Energy Breakdown Table */}
          <div className="mb-6">
            <EnhancedEnergyBreakdownTable 
              data={enhancedTableData}
              equipment={equipment}
              totalEstimatedElectric={totalEnergy.totalElectric}
              totalEstimatedGas={totalEnergy.totalGas}
              totalActualElectric={actualUtilityData.totalElectric}
              totalActualGas={actualUtilityData.totalGas}
            />
          </div>

          {/* End Use By Type Tables */}
          <div className="mb-6">
            <EndUseByTypeTable 
              data={endUseData}
              title="Energy End Use Breakdown"
              description="Breakdown of energy use by end use category based on equipment data"
            />
          </div>
        </>
      )}

      {activeTab === 'charts' && (
        <div className="mb-6">
          <EnergyPieChartDashboard
            data={endUseData}
            conversionFactors={conversionFactors}
          />
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Equipment Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Wattage</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Annual kWh</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>End Use Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell className="font-medium">{item.equipment_type}</TableCell>
                        <TableCell>{item.category || '-'}</TableCell>
                        <TableCell>{item.quantity || 1}</TableCell>
                        <TableCell>{item.wattage || '-'}</TableCell>
                        <TableCell>{item.capacity || '-'}</TableCell>
                        <TableCell>{item.annual_kwh || '-'}</TableCell>
                        <TableCell>
                          {typeof item.location === 'string'
                            ? item.location
                            : item.location
                              ? `${item.location.room || ''} ${item.location.floor || ''}`
                              : '-'}
                        </TableCell>
                        <TableCell>
                          {mapEquipmentToCategory(item.equipment_type, item.category) || 'Other'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toggle for legacy components */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setShowLegacyComponents(!showLegacyComponents)}
        >
          {showLegacyComponents ? 'Hide' : 'Show'} Legacy Components
        </Button>
      </div>

      {/* Legacy components that can be toggled on/off */}
      {showLegacyComponents && (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BuildingInformationCard buildingInfo={data.buildingInfo} />
        <div className="lg:col-span-2">
          <UtilityComparisonCard 
                estimatedUsage={totalEnergy.totalElectric}
                actualUsage={actualUtilityData.totalElectric}
                difference={actualUtilityData.totalElectric - totalEnergy.totalElectric}
                differencePercentage={totalEnergy.totalElectric ? 
                  ((actualUtilityData.totalElectric - totalEnergy.totalElectric) / totalEnergy.totalElectric) * 100 
                  : 0}
          />
        </div>
      </div>

      <Tabs defaultValue="breakdown" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="breakdown">Energy Breakdown</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Details</TabsTrigger>
          {/* <TabsTrigger value="assumptions">Assumptions</TabsTrigger> */}
        </TabsList>
        
        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Energy Use Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <EnergyBreakdownSection 
                energyBreakdown={data.energyBreakdown}
                adjustments={adjustments}
                onAdjustmentChange={handleAdjustmentChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <EquipmentCategoriesTable
                equipment={data.equipment}
                buildingInfo={data.buildingInfo}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* <TabsContent value="assumptions">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Assumptions</CardTitle>
            </CardHeader>
            <CardContent>
              <AssumptionsPanel assumptions={data.assumptions} />
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
        </>
      )}
    </div>
  );
};

export default EnergyAnalysisPage;