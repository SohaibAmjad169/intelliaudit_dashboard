import React, { useMemo, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { STANDARD_END_USE_CATEGORIES } from '../services/energyAnalysis.service';
import { EnhancedTableData, EquipmentItem } from '../types/energyAnalysis.types';

// Define utility rates as constants
const ELECTRIC_RATE = 0.18; // $0.18 per kWh
const GAS_RATE = 1.05; // $1.05 per therm
const DEVIATION_THRESHOLD_WARN = 10; // Percentage points for warning

interface EnhancedEnergyBreakdownTableProps {
  data: EnhancedTableData[];
  equipment: EquipmentItem[]; // Add equipment data
  totalEstimatedElectric: number;
  totalEstimatedGas: number;
  totalActualElectric: number;
  totalActualGas: number;
}

export const EnhancedEnergyBreakdownTable: React.FC<EnhancedEnergyBreakdownTableProps> = ({
  data,
  equipment,
  totalEstimatedElectric,
  totalEstimatedGas,
  totalActualElectric,
  totalActualGas
}) => {
  const [sortColumn, setSortColumn] = React.useState<string>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const sortedData = useMemo(() => {
    if (sortColumn === 'name' && sortDirection === 'asc') {
      // Use standard category order
      const dataMap = new Map(data.map(item => [item.name, item]));
      return STANDARD_END_USE_CATEGORIES
        .filter(name => dataMap.has(name))
        .map(name => dataMap.get(name)!);
    }
    
    return [...data].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === 'electricPercent') {
        comparison = (a.electricPercent || 0) - (b.electricPercent || 0);
      } else if (sortColumn === 'gasPercent') {
        comparison = (a.gasPercent || 0) - (b.gasPercent || 0);
      } else if (sortColumn === 'electricKwh') {
        comparison = (a.electricKwh || 0) - (b.electricKwh || 0);
      } else if (sortColumn === 'gasTherm') {
        comparison = (a.gasTherm || 0) - (b.gasTherm || 0);
      } else if (sortColumn === 'standardElectricPercent') {
        comparison = (a.standardElectricPercent || 0) - (b.standardElectricPercent || 0);
      } else if (sortColumn === 'standardGasPercent') {
        comparison = (a.standardGasPercent || 0) - (b.standardGasPercent || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  // Group equipment by category
  const equipmentByCategory = useMemo(() => {
    const result: Record<string, EquipmentItem[]> = {};
    
    equipment.forEach(item => {
      // Determine the category
      const category = item.end_use_category || 
                     (item.category && STANDARD_END_USE_CATEGORIES.includes(item.category) 
                      ? item.category 
                      : getEquipmentCategory(item));
      
      if (!category) return;
      
      if (!result[category]) {
        result[category] = [];
      }
      
      result[category].push(item);
    });
    
    return result;
  }, [equipment]);

  // Function to determine equipment category
  const getEquipmentCategory = (item: EquipmentItem): string => {
    // This should use the same logic as in EnergyAnalysisPage for consistency
    const equipmentType = item.equipment_type.toLowerCase();
    
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
      'water heater': 'Water Heating',
      'washer': 'Laundry',
      'dryer': 'Laundry',
      'cooking': 'Cooking',
      'stove': 'Cooking',
      'oven': 'Cooking',
      'microwave': 'Cooking',
      'compressor': 'Air Compressors',
      'pool': 'Pool/Spa',
      'spa': 'Pool/Spa',
    };
    
    // Try to find a matching category
    for (const [key, value] of Object.entries(typeToCategory)) {
      if (equipmentType.includes(key)) {
        return value;
      }
    }
    
    // If no match, return "Other"
    return 'Other';
  };

  // Calculate total costs
  const totalEstimatedElectricCost = totalEstimatedElectric * ELECTRIC_RATE;
  const totalEstimatedGasCost = totalEstimatedGas * GAS_RATE;
  const totalActualElectricCost = totalActualElectric * ELECTRIC_RATE;
  const totalActualGasCost = totalActualGas * GAS_RATE;

  // Calculate variance between estimated and actual
  const electricVariance = totalActualElectric > 0 
    ? ((totalActualElectric - totalEstimatedElectric) / totalActualElectric) * 100 
    : 0;
  
  const gasVariance = totalActualGas > 0 
    ? ((totalActualGas - totalEstimatedGas) / totalActualGas) * 100 
    : 0;
  
  // Function to get variance color based on percentage difference
  const getVarianceColor = (variance: number): string => {
    const absVariance = Math.abs(variance);
    if (absVariance <= 10) return 'bg-green-100 text-green-800'; // Good match (within 10%)
    if (absVariance <= 30) return 'bg-yellow-100 text-yellow-800'; // Moderate match (10-30%)
    return 'bg-red-100 text-red-800'; // Poor match (>30%)
  };

  // Format variance for display with +/- sign
  const formatVariance = (variance: number): string => {
    return variance > 0 ? `+${variance.toFixed(1)}%` : `${variance.toFixed(1)}%`;
  };

  // Get background color intensity based on percentage
  const getBackgroundColorForPercentage = (percent: number, isElectric: boolean) => {
    if (percent === 0) return '';
    
    const intensity = Math.min(Math.max(percent / 50, 0.1), 0.5);
    
    if (isElectric) {
      return `rgba(59, 130, 246, ${intensity})`; // Blue for electric
    } else {
      return `rgba(239, 68, 68, ${intensity})`; // Red for gas
    }
  };

  // Helper function to estimate annual hours based on equipment type/location
  const estimateHours = (item: EquipmentItem): number => {
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
    
    // Cooking equipment
    if (equipmentType.includes('stove') ||
        equipmentType.includes('oven') ||
        equipmentType.includes('cooking')) {
      return 730; // ~2 hours/day
    }
    
    // Refrigeration
    if (equipmentType.includes('refrigerator') || 
        equipmentType.includes('fridge')) {
      return 8760; // 24 hours/day but cycling (factored into wattage)
    }
    
    // Default for other equipment
    return 1460; // 4 hours/day as a default
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Energy End Use Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px] font-bold border border-border">
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-bold"
                    onClick={() => handleSort('name')}
                  >
                    End Use Component
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead colSpan={2} className="text-center font-bold border border-border">
                  Percent of Total Energy
                </TableHead>
                <TableHead colSpan={4} className="text-center font-bold border border-border">
                  Est. Energy Use
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="border border-border"></TableHead>
                <TableHead className="text-center font-bold border border-border w-[100px]">
                  <Button 
                    variant="ghost"
                    className="p-0 h-auto font-bold"
                    onClick={() => handleSort('electricPercent')}
                  >
                    Electric %
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center font-bold border border-border w-[100px]">
                   <Button
                    variant="ghost"
                    className="p-0 h-auto font-bold"
                    onClick={() => handleSort('standardElectricPercent')}
                  >
                    Std. Elec. %
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center font-bold border border-border w-[100px]">
                  <Button 
                    variant="ghost"
                    className="p-0 h-auto font-bold"
                    onClick={() => handleSort('gasPercent')}
                  >
                    Gas %
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center font-bold border border-border w-[100px]">
                  <Button
                    variant="ghost"
                    className="p-0 h-auto font-bold"
                    onClick={() => handleSort('standardGasPercent')}
                  >
                    Std. Gas %
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center font-bold border border-border w-[120px]">
                  <Button 
                    variant="ghost"
                    className="p-0 h-auto font-bold"
                    onClick={() => handleSort('electricKwh')}
                  >
                    Electric
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center font-bold border border-border w-[120px]">
                  Electric Cost
                </TableHead>
                <TableHead className="text-center font-bold border border-border w-[100px]">
                  <Button 
                    variant="ghost"
                    className="p-0 h-auto font-bold"
                    onClick={() => handleSort('gasTherm')}
                  >
                    Gas
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center font-bold border border-border w-[100px]">
                  Gas Cost
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <React.Fragment key={item.name}>
                  <TableRow 
                    className={index % 2 === 0 ? 'bg-muted/20' : ''}
                    onClick={() => toggleCategoryExpansion(item.name)}
                  >
                    <TableCell className="font-medium border border-border cursor-pointer hover:bg-muted/30">
                      <div className="flex items-center">
                        {expandedCategories.includes(item.name) ? 
                          <ChevronDown className="h-4 w-4 mr-1" /> : 
                          <ChevronRight className="h-4 w-4 mr-1" />
                        }
                        {item.name}
                      </div>
                    </TableCell>                    
                    <TableCell
                      className={cn(
                        "text-center border border-border font-medium",
                        item.standardElectricPercent !== undefined && Math.abs(item.electricPercent - item.standardElectricPercent) > DEVIATION_THRESHOLD_WARN && "bg-yellow-100 dark:bg-yellow-800/30"
                      )}
                      style={{
                        backgroundColor: getBackgroundColorForPercentage(item.electricPercent, true),
                      }}
                    >
                      {item.electricPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center border border-border">
                      {item.standardElectricPercent !== undefined ? `${item.standardElectricPercent.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-center border border-border font-medium",
                        item.standardGasPercent !== undefined && Math.abs(item.gasPercent - item.standardGasPercent) > DEVIATION_THRESHOLD_WARN && "bg-yellow-100 dark:bg-yellow-800/30"
                      )}
                      style={{
                        backgroundColor: getBackgroundColorForPercentage(item.gasPercent, false),
                      }}
                    >
                      {item.gasPercent.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center border border-border">
                       {item.standardGasPercent !== undefined ? `${item.standardGasPercent.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell 
                      className={cn(
                        "text-right border border-border font-medium",
                        item.electricKwh === null && "text-muted-foreground"
                      )}
                      style={{ 
                        backgroundColor: getBackgroundColorForPercentage(item.electricPercent, true)
                      }}
                    >
                      {item.electricKwh !== null 
                        ? item.electricKwh.toLocaleString(undefined, {maximumFractionDigits: 1})
                        : '-'}
                    </TableCell>
                    <TableCell 
                      className={cn(
                        "text-right border border-border font-medium",
                        item.electricKwh === null && "text-muted-foreground"
                      )}
                      style={{ 
                        backgroundColor: getBackgroundColorForPercentage(item.electricPercent, true)
                      }}
                    >
                      {item.electricKwh !== null 
                        ? `$${(item.electricKwh * ELECTRIC_RATE).toLocaleString(undefined, {maximumFractionDigits: 2})}` 
                        : '-'}
                    </TableCell>
                    <TableCell 
                      className={cn(
                        "text-right border border-border font-medium",
                        item.gasTherm === null && "text-muted-foreground"
                      )}
                      style={{ 
                        backgroundColor: getBackgroundColorForPercentage(item.gasPercent, false)
                      }}
                    >
                      {item.gasTherm !== null 
                        ? item.gasTherm.toLocaleString(undefined, {maximumFractionDigits: 1})
                        : '-'}
                    </TableCell>
                    <TableCell 
                      className={cn(
                        "text-right border border-border font-medium",
                        item.gasTherm === null && "text-muted-foreground"
                      )}
                      style={{ 
                        backgroundColor: getBackgroundColorForPercentage(item.gasPercent, false)
                      }}
                    >
                      {item.gasTherm !== null 
                        ? `$${(item.gasTherm * GAS_RATE).toLocaleString(undefined, {maximumFractionDigits: 2})}` 
                        : '-'}
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded equipment view */}
                  {expandedCategories.includes(item.name) && equipmentByCategory[item.name] && (
                    <TableRow className={index % 2 === 0 ? 'bg-muted/10' : 'bg-white'}>
                      <TableCell colSpan={9} className="p-0 border-x border-b border-border">
                        <div className="p-3">
                          <h4 className="text-sm font-semibold mb-2">{item.name} Equipment ({equipmentByCategory[item.name]?.length || 0} items)</h4>
                          <Table>
                            <TableHeader className="bg-muted/30">
                              <TableRow>
                                <TableHead className="py-1">Equipment Type</TableHead>
                                <TableHead className="py-1">Fixtures</TableHead>
                                <TableHead className="py-1">Lamps/Fixture</TableHead>
                                <TableHead className="py-1">Multiplier</TableHead>
                                <TableHead className="py-1">Wattage</TableHead>
                                <TableHead className="py-1">Annual Hours</TableHead>
                                <TableHead className="py-1">Annual kWh</TableHead>
                                <TableHead className="py-1">End Use Category</TableHead>
                                <TableHead className="py-1">Used in Calculation</TableHead>
                                <TableHead className="py-1">Location</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {equipmentByCategory[item.name]?.map((eq, i) => {
                                // Calculate the annual kWh used in calculation
                                let usedKwh = eq.annual_kwh;
                                let isEstimated = false;
                                
                                if (!usedKwh) {
                                  isEstimated = true;
                                  // Estimate based on equipment type & quantity
                                  if (eq.wattage && eq.annual_hours) {
                                    usedKwh = (eq.wattage * eq.annual_hours * (eq.quantity || 1)) / 1000;
                                  } else if (eq.wattage) {
                                    // Estimate hours based on location/type
                                    const hours = estimateHours(eq);
                                    usedKwh = (eq.wattage * hours * (eq.quantity || 1)) / 1000;
                                  } else if (item.name === "Cooling") {
                                    usedKwh = 500 * (eq.quantity || 1);
                                  } else if (item.name === "Cooking") {
                                    usedKwh = 700 * (eq.quantity || 1);
                                  } else if (item.name === "Office Equipment") {
                                    usedKwh = 300 * (eq.quantity || 1);
                                  } else if (item.name === "Pool/Spa") {
                                    usedKwh = 2500;
                                  }
                                }
                                
                                // Estimate annual hours if not provided
                                const estimatedHours = eq.annual_hours || estimateHours(eq);
                                
                                return (
                                  <TableRow key={eq.id || i} className={i % 2 === 0 ? 'bg-muted/5' : ''}>
                                    <TableCell className="py-1">{eq.equipment_type}</TableCell>
                                    <TableCell className="py-1">{eq.quantity || 1}</TableCell>
                                    <TableCell className="py-1">
                                      {eq.lamps_per_fixture !== undefined ? (
                                        eq.lamps_per_fixture
                                      ) : (
                                        <span className="text-amber-600 italic">1</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {eq.multiplier !== undefined ? (
                                        eq.multiplier
                                      ) : (
                                        <span className="text-amber-600 italic">1</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {eq.wattage ? (
                                        eq.wattage
                                      ) : (
                                        <span className="text-amber-600 italic">Unknown</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {eq.annual_hours ? (
                                        eq.annual_hours
                                      ) : (
                                        <span className="text-amber-600 italic">~{estimatedHours} (est.)</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {eq.annual_kwh ? (
                                        eq.annual_kwh.toFixed(1)
                                      ) : (
                                        <span className="text-amber-600 italic">Not specified</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {eq.end_use_category || (
                                        <span className="text-amber-600 italic">{item.name}</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {isEstimated ? (
                                        <span className="text-amber-600 italic">~{usedKwh?.toFixed(1)} (est.)</span>
                                      ) : (
                                        usedKwh?.toFixed(1)
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1">
                                      {typeof eq.location === 'string'
                                        ? eq.location
                                        : eq.location
                                          ? `${eq.location.room || ''} ${eq.location.floor || ''}`
                                          : '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {!equipmentByCategory[item.name] || equipmentByCategory[item.name].length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={9} className="py-1 text-center text-muted-foreground">
                                    No equipment items found in this category
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              <TableRow className="bg-muted/70 font-bold">
                <TableCell className="border border-border" colSpan={1}>Total Estimated</TableCell>
                <TableCell className="text-center border border-border" colSpan={2}>100%</TableCell>
                <TableCell className="text-center border border-border" colSpan={2}>100%</TableCell>
                <TableCell className="text-right border border-border">
                  {typeof totalEstimatedElectric === 'number' 
                    ? totalEstimatedElectric.toLocaleString(undefined, {maximumFractionDigits: 1}) 
                    : '0'}
                </TableCell>
                <TableCell className="text-right border border-border">
                  ${typeof totalEstimatedElectricCost === 'number' 
                    ? totalEstimatedElectricCost.toLocaleString(undefined, {maximumFractionDigits: 2}) 
                    : '0'}
                </TableCell>
                <TableCell className="text-right border border-border">
                  {typeof totalEstimatedGas === 'number' 
                    ? totalEstimatedGas.toLocaleString(undefined, {maximumFractionDigits: 1}) 
                    : '0'}
                </TableCell>
                <TableCell className="text-right border border-border">
                  ${typeof totalEstimatedGasCost === 'number' 
                    ? totalEstimatedGasCost.toLocaleString(undefined, {maximumFractionDigits: 2}) 
                    : '0'}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/70 font-bold">
                <TableCell className="border border-border" colSpan={1}>Total Actual</TableCell>
                <TableCell className="text-center border border-border" colSpan={2}>100%</TableCell>
                <TableCell className="text-center border border-border" colSpan={2}>100%</TableCell>
                <TableCell className="text-right border border-border">
                  {typeof totalActualElectric === 'number' 
                    ? totalActualElectric.toLocaleString(undefined, {maximumFractionDigits: 1}) 
                    : '0'}
                </TableCell>
                <TableCell className="text-right border border-border">
                  ${typeof totalActualElectricCost === 'number' 
                    ? totalActualElectricCost.toLocaleString(undefined, {maximumFractionDigits: 2}) 
                    : '0'}
                </TableCell>
                <TableCell className="text-right border border-border">
                  {typeof totalActualGas === 'number' 
                    ? totalActualGas.toLocaleString(undefined, {maximumFractionDigits: 1}) 
                    : '0'}
                </TableCell>
                <TableCell className="text-right border border-border">
                  ${typeof totalActualGasCost === 'number' 
                    ? totalActualGasCost.toLocaleString(undefined, {maximumFractionDigits: 2}) 
                    : '0'}
                </TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell className="border border-border" colSpan={1}>Variance (Est vs Actual)</TableCell>
                <TableCell colSpan={3} className={cn("text-center border border-border px-2 py-1", getVarianceColor(electricVariance))}>
                  {formatVariance(electricVariance)}
                </TableCell>
                {/* <TableCell colSpan={2} className={cn("text-center border border-border", getVarianceColor(electricVariance))}>
                  {totalEstimatedElectric < totalActualElectric ? 'Underestimated' : 'Overestimated'}
                </TableCell> */}
                <TableCell colSpan={2} className={cn("text-center border border-border", getVarianceColor(gasVariance))}>
                  {totalEstimatedGas < totalActualGas ? 'Underestimated' : 'Overestimated'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          <p>This breakdown shows the estimated energy consumption by end use category. Electric usage is shown in kWh and gas usage in therms. Cost calculations are based on rates of ${ELECTRIC_RATE.toFixed(2)}/kWh for electricity and ${GAS_RATE.toFixed(2)}/therm for gas.</p>
          <p className="mt-2">Variance indicators: <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Good (±10%)</span> <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded mx-2">Moderate (±10-30%)</span> <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Poor ({'>'}±30%)</span></p>
        </div>
      </CardContent>
    </Card>
  );
};