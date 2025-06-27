import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '@/services/common/api-client';
import { Loader2, AlertCircle, Info, Edit, Trash2, Zap, ClipboardList, Camera, Plus, Sparkles, Thermometer, Lightbulb, Droplet, Image, Shirt, Sprout, Utensils, Waves, Database, AlertTriangle, ChevronDown, Wind, RefreshCw } from 'lucide-react';
import { DeviationExplanations } from './DeviationExplanations';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { fetchTotalUtilityUsage } from '@/services/energy-analysis';
import { fieldNotesService } from '@/services/field-notes';
import { equipmentV2Service } from '@/services/equipment/equipment-v2';
import { toast } from '@/components/ui/use-toast';
import { useParams } from 'react-router-dom';
import { EquipmentItem, Location, EquipmentCondition } from './types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { EnergyBreakdown, EndUseComponent } from '@/services/field-notes/field-notes.types';
import { EnergyBreakdownDialog } from './EnergyBreakdownDialog';

// Component props
interface EquipmentProps {
  projectId: string;
  equipment?: EquipmentItem[];
  project?: {
    id: string;
    raw_notes?: string;
    [key: string]: any;
  };
  publicView?: boolean;
}

// Add these constants and types before the component
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

// We'll need to pass the components to the tooltip
const CustomTooltip = ({ active, payload, components }: any) => {
  if (active && payload && payload.length) {
    // Find the component with deviation explanation
    const name = payload[0].name;
    const component = components?.find(c => c.name === name);

    return (
      <div className="bg-background border border-border p-3 rounded-md shadow-md max-w-xs">
        <p className="font-medium capitalize">{name}</p>
        <p className="text-sm mb-1">{`${payload[0].value.toLocaleString()} kBTU (${payload[0].payload.percentage}%)`}</p>
        {payload[0].payload.originalKwh > 0 && (
          <p className="text-xs text-muted-foreground">{Math.round(payload[0].payload.originalKwh).toLocaleString()} kWh electric</p>
        )}

        {component?.standardPercent && (
          <p className="text-xs text-blue-600 mt-1">Standard: {component.standardPercent}%</p>
        )}

        {component?.deviationExplanation && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">{component.deviationExplanation}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const EnergyChart: React.FC<EquipmentProps> = ({
  projectId: propProjectId,
  equipment: initialEquipment = [],
  project,
  publicView
}) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const projectId = propProjectId || routeProjectId;

  // State
  const [equipment, setEquipment] = useState<EquipmentItem[]>(initialEquipment);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [showEnergyBreakdown, setShowEnergyBreakdown] = useState(false);
  const [actualElectricUsage, setActualElectricUsage] = useState<number | null>(null);
  const [projectDetails, setProjectDetails] = useState<{ total_units?: number, building_type?: string }>({});
  const [energyBreakdown, setEnergyBreakdown] = useState<EnergyBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  // Add state for actual gas usage
  const [actualGasUsage, setActualGasUsage] = useState<number | null>(null);
  
  const isApartmentEquipment = (item: EquipmentItem): boolean => item.is_per_unit === true;

  // Fetch equipment data
  const fetchEquipmentData = useCallback(async () => {
    console.log('Fetching equipment data for project:', projectId);
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      // Fetch equipment data from the API
      const equipmentData = await equipmentV2Service.getAllEquipment(projectId);
      console.log('Raw API Response:', JSON.stringify(equipmentData[0], null, 2));

      if (Array.isArray(equipmentData)) {
        // Sort equipment by source type (field notes first), then category and type
        const sortedData = [...equipmentData].sort((a, b) => {
          // First sort by source type (field notes first)
          if (a.source_type === 'field_notes' && b.source_type !== 'field_notes') return -1;
          if (a.source_type !== 'field_notes' && b.source_type === 'field_notes') return 1;

          // Then sort by category
          const categoryCompare = (a.category || '').localeCompare(b.category || '');
          if (categoryCompare !== 0) return categoryCompare;

          // Finally sort by equipment type
          return (a.equipment_type || '').localeCompare(b.equipment_type || '');
        });

        // Set the sorted data directly
        setEquipment(sortedData);
      } else {
        console.warn('Equipment data is not an array:', equipmentData);
        setEquipment([]);
      }
    } catch (error: any) {
      console.error('Error fetching equipment data:', error);
      setError(error.message || 'Failed to fetch equipment data');
      setEquipment([]);
    }
  }, [projectId]);

  // Add handler for regenerating comprehensive energy breakdown
  const handleComprehensiveEnergyBreakdown = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      console.log('Generating baseline energy breakdown for project:', projectId);
      const response = await apiClient.post<EnergyBreakdown>(`/field-notes/${projectId}/baseline-energy-breakdown`);
      console.log('Baseline energy breakdown response:', response);

      if (response && response.endUseComponents && response.endUseComponents.length > 0) {
        setEnergyBreakdown(response);
        setForceUpdate(prev => !prev); // Toggle to force re-render
        toast({
          description: "Energy breakdown regenerated successfully.",
        });
      } else {
        throw new Error('Invalid energy breakdown response');
      }
    } catch (error) {
      console.error('Error generating baseline energy breakdown:', error);
      toast({
        variant: "destructive",
        description: "Failed to regenerate energy breakdown. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Add handler for viewing energy breakdown details
  const handleViewEnergyBreakdown = useCallback(() => {
    if (energyBreakdown) {
      setShowEnergyBreakdown(true);
    } else {
      toast({
        variant: "destructive",
        description: "No energy breakdown data available.",
      });
    }
  }, [energyBreakdown]);

  // Fetch actual utility data
  const fetchActualUtilityData = useCallback(async () => {
    try {
      if (projectId) {
        const usageData = await fetchTotalUtilityUsage(projectId);
        // Set both electric and gas usage
        if (usageData) {
          setActualElectricUsage(usageData.totalElectric ?? null);
          setActualGasUsage(usageData.naturalGasUsage ?? null); // Use naturalGasUsage from the service
          console.log('Fetched Actual Utility Data:', usageData); // Log fetched data
        }
      }
    } catch (error) {
      console.error('Failed to load utility data:', error);
      // Don't clear usage on error, keep previous values if any
    }
  }, [projectId]);

  // Fetch project details to get total units
  const fetchProjectDetails = useCallback(async () => {
    try {
      if (!projectId) return;

      const response = await apiClient.get(`projects/${projectId}`) as { data: any };
      const projectData = response.data;

      if (projectData) {
        const buildingType = projectData.building_info?.building_type ||
                      projectData.building_type || '';
        console.log('Building type detected:', buildingType);
        setProjectDetails({
          total_units: projectData.building_info?.total_units ||
                      projectData.total_units || 1,
          building_type: buildingType
        });
      }
    } catch (error) {
      console.error('Failed to load project details:', error);
    }
  }, [projectId]);

  // Add function to fetch energy breakdown
  const fetchEnergyBreakdown = useCallback(async () => {
    if (!projectId) return;

    setLoadingBreakdown(true);
    try {
      console.log('Fetching energy breakdown for project:', projectId);
      const breakdown = await fieldNotesService.getEnergyBreakdown(projectId);
      console.log('Energy breakdown response:', breakdown);
      if (breakdown) {
        setEnergyBreakdown(breakdown);
      } else {
        console.log('No energy breakdown data available');
      }
    } catch (error) {
      console.error('Error fetching energy breakdown:', error);
    } finally {
      setLoadingBreakdown(false);
    }
  }, [projectId]);

  // Update useEffect to fetch energy breakdown
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchEquipmentData(),
          fetchActualUtilityData(),
          fetchProjectDetails(),
          fetchEnergyBreakdown(),
        ]);
      } catch (error: any) {
        console.error('Error initializing data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchEquipmentData, fetchActualUtilityData, fetchProjectDetails, fetchEnergyBreakdown]);

  // Add useEffect to log equipment state after update
  useEffect(() => {
    if (equipment.length > 0) {
      console.log("Equipment state updated. Checking specific items:");
      const itemToCheck1 = equipment.find(item => item.id === '48225c31-48c8-4726-8ca0-3b29b4a90d99'); // Gas Water Heater
      const itemToCheck2 = equipment.find(item => item.id === 'a01620bb-2b0d-4e06-9dbb-6c0a3301ead3'); // Storage Tank Water Heater
      console.log("Gas Water Heater (4822...):", itemToCheck1 ? `annual_therms: ${itemToCheck1.annual_therms}` : 'Not found');
      console.log("Storage Tank WH (a016...):", itemToCheck2 ? `annual_therms: ${itemToCheck2.annual_therms}` : 'Not found');
      // You can add more items here if needed
    }
  }, [equipment]); // Run this effect whenever the equipment state changes

  // Replace the energy breakdown section with this updated version
  const renderEnergyBreakdown = () => {
    // forceUpdate is used to trigger re-render when data changes
    console.log('Rendering energy breakdown with data:', energyBreakdown, 'forceUpdate:', forceUpdate);
    if (!energyBreakdown || !energyBreakdown.endUseComponents.length) {
      console.log('No energy breakdown to render:',
        !energyBreakdown ? 'energyBreakdown is null' : 'endUseComponents is empty');
      return null;
    }

    // Check if no utility data was available
    if (energyBreakdown.noUtilityDataAvailable) {
      return (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-lg font-medium text-amber-800">No Utility Data Available</span>
          </div>
          <p className="text-amber-700">
            Energy breakdown is based solely on equipment data. For a more accurate breakdown,
            please add utility bill data to your project.
          </p>
        </div>
      );
    }

    // First, clean up category names by removing trailing '0'
    energyBreakdown.endUseComponents.forEach(component => {
      if (component.name.endsWith('0')) {
        component.name = component.name.replace(/0$/, '');
      }
    });

    // Check for duplicate categories
    const categoryNames = energyBreakdown.endUseComponents.map(c => c.name);
    const duplicateCategories = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
    console.log('All categories:', categoryNames);
    console.log('Duplicate categories:', duplicateCategories);

    // Show all categories in the chart, even those with zero energy usage
    // Deduplicate categories by combining them and clean up category names
    const uniqueComponents = [];
    const processedNames = new Set();

    for (const component of energyBreakdown.endUseComponents) {
      // Clean up category name by removing trailing '0'
      const cleanName = component.name.replace(/0$/, '');

      // Create a cleaned component with the fixed name
      const cleanedComponent = {
        ...component,
        name: cleanName
      };

      if (processedNames.has(cleanName)) {
        // Find the existing component and combine values
        const existingComponent = uniqueComponents.find(c => c.name === cleanName);
        if (existingComponent) {
          existingComponent.electricKwh += cleanedComponent.electricKwh;
          existingComponent.electricPercent += cleanedComponent.electricPercent;
          existingComponent.gasTherms += (cleanedComponent.gasTherms || 0);
          // Combine deviation explanations if both have them
          if (cleanedComponent.deviationExplanation && existingComponent.deviationExplanation) {
            existingComponent.deviationExplanation += '; ' + cleanedComponent.deviationExplanation;
          } else if (cleanedComponent.deviationExplanation) {
            existingComponent.deviationExplanation = cleanedComponent.deviationExplanation;
          }
        }
      } else {
        // Add new component with cleaned name
        uniqueComponents.push(cleanedComponent);
        processedNames.add(cleanName);
      }
    }

    // Ensure kWh values match percentages
    const totalElectric = energyBreakdown.totalActualElectric ||
      uniqueComponents.reduce((sum, comp) => sum + (comp.electricKwh || 0), 0);

    const totalGas = energyBreakdown.totalActualGas !== null ? energyBreakdown.totalActualGas :
      uniqueComponents.reduce((sum, comp) => sum + (comp.gasTherms || 0), 0);

    // Convert all energy to kBTU for consistent comparison
    uniqueComponents.forEach(comp => {
      // Store original values
      comp.originalElectricKwh = comp.electricKwh;

      // Convert electric kWh to kBTU (1 kWh = 3.412 kBTU)
      const electricKbtu = comp.electricKwh * 3.412;

      // Convert gas therms to kBTU (1 therm = 100 kBTU)
      const gasKbtu = comp.gasTherms * 100;

      // Store total kBTU for this component
      comp.totalKbtu = electricKbtu + gasKbtu;

      console.log(`${comp.name}: Electric ${electricKbtu.toFixed(0)} kBTU, Gas ${gasKbtu.toFixed(0)} kBTU, Total ${comp.totalKbtu.toFixed(0)} kBTU`);
    });

    // Calculate the new total energy in kBTU
    const totalCombinedKbtu = uniqueComponents.reduce((sum, comp) => sum + (comp.totalKbtu || 0), 0);

    // Now recalculate percentages based on the total kBTU
    uniqueComponents.forEach(comp => {
      // Calculate percentage based on the component's share of total energy
      if (totalCombinedKbtu > 0) {
        comp.electricPercent = (comp.totalKbtu / totalCombinedKbtu) * 100;
      }
    });

    // Make sure all component names are cleaned up
    uniqueComponents.forEach(comp => {
      if (comp.name.endsWith('0')) {
        comp.name = comp.name.replace(/0$/, '');
        console.log(`Cleaned up component name to: ${comp.name}`);
      }
    });

    console.log('Deduplicated components:', uniqueComponents);

    // Ensure all categories have at least a minimum value to be visible in the chart
    // This is especially important for categories like Cooking, Refrigeration, Laundry in multifamily buildings
    const chartData = uniqueComponents
      .map((component, index) => {
        // For important multifamily categories, ensure they have a minimum visible value
        const isImportantCategory = ['Cooking', 'Refrigeration', 'Laundry', 'Miscellaneous'].includes(component.name);
        const minValue = isImportantCategory ? 5 : 0.1; // Higher minimum for important categories

        return {
          name: component.name,
          // Use a minimum value for zero/low-usage categories to make them visible
          value: Math.max(Math.round(component.totalKbtu || 0), minValue),
          percentage: component.electricPercent.toFixed(1),
          originalKwh: component.originalElectricKwh,
          kbtu: component.totalKbtu,
          color: COLORS[index % COLORS.length]
        };
      });

    console.log('Chart data:', chartData);

    return (
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Breakdown Chart */}
        <div className="p-4 bg-muted rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-5 h-5 text-emerald-500" />
              <span className="text-lg font-medium">Energy Breakdown</span>
            </div>
            {/* Conditionally render the buttons only if not in publicView */}
            {!publicView && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleComprehensiveEnergyBreakdown}
                  className=""
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewEnergyBreakdown}
                >
                  View Details
                </Button>
              </div>
            )}
          </div>
          <div className="h-[400px]">
            {/* 1. Conditionally render info text */}
            {!publicView && (
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Info className="h-3 w-3 text-blue-500" />
                <span>Hover over categories for details. Categories with * have deviations from standard.</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="95%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={140}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent, index }) => {
                    const component = uniqueComponents.find(c => c.name === name);
                    if (percent < 0.005) return null;

                    // 2. Conditionally add asterisk to label
                    const showAsterisk = !publicView && component?.deviationExplanation;
                    const labelBase = `${name} ${(percent * 100).toFixed(1)}%`;

                    return showAsterisk ? `${labelBase}*` : labelBase;
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {!publicView && (
                  <RechartsTooltip content={<CustomTooltip components={uniqueComponents} />} />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Deviation Explanations - Always show for multifamily buildings */}
          {(projectDetails?.building_type?.toLowerCase() === 'multifamily' ||
            projectDetails?.building_type?.toLowerCase() === 'apartment') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-blue-700">Why these percentages differ from standard</span>
              </div>
              <DeviationExplanations components={uniqueComponents} />
              {!uniqueComponents.some(c => c.deviationExplanation) && (
                <p className="text-sm text-blue-600 italic">No significant deviations from standard multifamily breakdown.</p>
              )}
            </div>
          )}
        </div>

        {/* Energy Breakdown Stats */}
        <div className="p-4 bg-muted rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-medium">Energy Distribution</span>
          </div>
          <div className="space-y-3">
            {uniqueComponents
              .sort((a, b) => (b.electricKwh + b.gasTherms * 29.3) - (a.electricKwh + a.gasTherms * 29.3))
              .map((component, index) => (
                <>
                  {component?.totalKbtu > 0 && (
                    <div key={component.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {/* 2. Conditionally render Distribution List Tooltip */}
                        {!publicView && component.deviationExplanation ? (
                          // Render with Tooltip only if NOT publicView AND deviation exists
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-1 cursor-help">
                                  {component.name.replace(/0$/, '')}
                                  {component.standardPercent && component.standardPercent > 0 && (
                                    <Info className="h-3 w-3 text-blue-500" />
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="text-sm">
                                  <div className="font-medium mb-1">Standard: {component.standardPercent}%</div>
                                  <div>{component.deviationExplanation}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          // Render plain span if publicView OR no deviation explanation
                          <span>{component.name.replace(/0$/, '')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {Math.round(component.totalKbtu || 0).toLocaleString()} kBTU
                        </span>
                        <span className="text-sm font-medium">{component.electricPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </>
              ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Total Energy Usage Summary */}
      {equipment.length > 0 && (
        <div className="mb-6 p-4 bg-muted rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-medium">Total Annual Energy Usage:</span>
            </div>
            <span className="text-xl font-semibold">
              {energyBreakdown ? (
                <>
                  {/* Convert to kBTU and display both */}
                  <div className="flex flex-col items-end">
                    <span>
                      {Math.round(energyBreakdown.totalActualElectric * 3.412).toLocaleString()} kBTU/year
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(energyBreakdown.totalActualElectric).toLocaleString()} kWh electric
                      {/* Use actualGasUsage state directly */}
                      {actualGasUsage !== null && actualGasUsage > 0 && (
                        <> + {Math.round(actualGasUsage).toLocaleString()} therms gas</>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                `${Math.round(
                  equipment.reduce((sum, item) => {
                    // Use the annual_kwh value directly from the database
                    const annualKwh = parseFloat(item.annual_kwh?.toString() || '0');
                    return sum + (isNaN(annualKwh) ? 0 : annualKwh);
                  }, 0) * 3.412 // Convert to kBTU
                ).toLocaleString()} kBTU/year`
              )}
            </span>
          </div>
        </div>
      )}

      {/* Energy Breakdown Summary */}
      {equipment.length > 0 && renderEnergyBreakdown()}
      
      {/* Energy Breakdown Dialog */}
      {showEnergyBreakdown && (
        <EnergyBreakdownDialog
          open={showEnergyBreakdown}
          onOpenChange={setShowEnergyBreakdown}
          equipment={equipment}
          totalApartmentCount={projectDetails?.total_units || 1}
          isApartmentEquipment={isApartmentEquipment}
        />
      )}
    </div>
  );
};
