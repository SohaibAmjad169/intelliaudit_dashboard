import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Define types for the component
// This type is used for chart data representation
// Exported for potential use in other components
export interface CategoryData {
  name: string;
  value: number;
  itemCount: number;
  percentage?: number;
  isGas?: boolean;
}

interface EndUseBreakdownProps {
  equipment: any[];
  actualElectricUsage?: number;
  actualNaturalGasUsage?: number;
  apartmentCount?: number;
}

// Required categories exactly matching the provided list
const CATEGORIES = [
  'Appliance',
  'Lighting',
  'Heating',
  'Cooling',
  'Others'
];

const EndUseBreakdown: React.FC<EndUseBreakdownProps> = ({ 
  equipment,
  actualElectricUsage,
  actualNaturalGasUsage,
  apartmentCount = 0
}) => {
  const { categories, totalKwh, electricTotal, gasTotal } = useMemo(() => {
    if (!equipment || equipment.length === 0) {
      return { 
        categories: [], 
        totalKwh: 0, 
        electricTotal: 0, 
        gasTotal: 0
      };
    }

    // Use provided actual values if available
    const actualElectric = actualElectricUsage || 0;
    const actualGas = actualNaturalGasUsage || 0;
    const actualTotal = actualElectric + actualGas;
    const hasActualData = actualTotal > 0;
    
    // Initialize categories with zero values
    const categoryMap: Record<string, {
      name: string,
      value: number,
      itemCount: number,
      isGas: boolean
    }> = {};
    
    CATEGORIES.forEach(category => {
      categoryMap[category] = {
        name: category,
        value: 0,
        itemCount: 0,
        isGas: false
      };
    });
    
    // Fill with equipment data
    equipment.forEach(item => {
      if (!item.annual_kwh) return;
      
      // Determine if gas
      const isGas = item.fuelType?.toLowerCase() === 'gas' || 
                   item.fuelType?.toLowerCase() === 'natural gas' ||
                   (item.equipment_type && (
                     item.equipment_type.toLowerCase().includes('gas') ||
                     item.equipment_type.toLowerCase().includes('boiler')
                   )) ||
                   (item.category && (
                     item.category.toLowerCase() === 'dhw'
                   ));
      
      // Skip gas equipment
      if (isGas) return;
      
      // Determine category
      let category = 'Others';
      
      if (item.category) {
        const cat = item.category.toLowerCase();
        if (cat.includes('hvac') && item.equipment_type?.toLowerCase().includes('cool')) {
          category = 'Cooling';
        } else if (cat.includes('hvac') || cat.includes('heat') || cat.includes('dhw') || cat.includes('water heat')) {
          category = 'Heating';
        } else if (cat.includes('light')) {
          category = 'Lighting';
        } else if (cat.includes('appliance') || 
                  cat.includes('kitchen') || 
                  cat.includes('laundry') ||
                  cat.includes('refriger') ||
                  cat.includes('dish')) {
          category = 'Appliance';
        }
      }

      if (item.equipment_type) {
        const type = item.equipment_type.toLowerCase();
        if (type.includes('light') || type.includes('lamp')) {
          category = 'Lighting';
        } else if (type.includes('cool') || type.includes('air cond')) {
          category = 'Cooling';
        } else if (type.includes('heat') || type.includes('water heat') || type.includes('dhw')) {
          category = 'Heating';
        } else if (type.includes('refriger') || 
                  type.includes('freezer') ||
                  type.includes('washer') || 
                  type.includes('dryer') ||
                  type.includes('dish') ||
                  type.includes('stove') ||
                  type.includes('oven') ||
                  type.includes('microwave') ||
                  type.includes('appliance')) {
          category = 'Appliance';
        }
      }
      
      // Add to category
      if (!categoryMap[category]) {
        // Fallback to Others if category somehow isn't in our predefined list
        category = 'Others';
      }
      
      categoryMap[category].value += item.annual_kwh;
      categoryMap[category].itemCount += item.quantity || 1;
      // Mark as gas if this item is gas-powered
      if (isGas) categoryMap[category].isGas = true;
    });
    
    // Convert to array
    let electricKwh = 0;
    let gasKwh = 0;
    
    const categoriesArray = Object.values(categoryMap)
      .filter(cat => cat.value > 0)
      .map(cat => {
        if (cat.isGas) {
          gasKwh += cat.value;
        } else {
          electricKwh += cat.value;
        }
        
        return {
          name: cat.name,
          value: cat.value,
          itemCount: cat.itemCount,
          isGas: cat.isGas
        };
      })
      .sort((a, b) => b.value - a.value);
    
    // Apply actual data if available
    const finalElectricKwh = hasActualData ? actualElectric : electricKwh;
    const finalGasKwh = hasActualData ? actualGas : gasKwh;
    const finalTotal = finalElectricKwh + finalGasKwh;
    
    // Calculate percentages
    const result = categoriesArray.map(cat => ({
      ...cat,
      percentage: (cat.value / finalTotal) * 100
    }));
    
    return {
      categories: result,
      totalKwh: finalTotal,
      electricTotal: finalElectricKwh,
      gasTotal: finalGasKwh
    };
  }, [equipment, actualElectricUsage, actualNaturalGasUsage]);

  // Color mapping for each category to match the screenshot
  const COLORS = {
    'Appliance': '#4CAF50',
    'Lighting': '#1E90FF',
    'Heating': '#FF7043',
    'Cooling': '#82ca9d',
    'Others': '#A0A0A0'
  };

  // Filter to show only electric equipment by default
  const displayCategories = useMemo(() => {
    return categories.filter(cat => !cat.isGas);
  }, [categories]);
  
  // Calculate electric-only percentages  
  const electricOnlyCategories = useMemo(() => {
    if (electricTotal === 0) return [];
    
    return displayCategories.map(cat => ({
      ...cat,
      percentage: (cat.value / electricTotal) * 100
    }));
  }, [displayCategories, electricTotal]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3 shadow-lg">
          <p className="text-zinc-100 font-medium">{data.name}</p>
          <p className="text-zinc-300">{Math.round(data.value).toLocaleString()} kWh</p>
          <p className="text-zinc-400">{data.percentage?.toFixed(1)}% of electric usage</p>
          <p className="text-zinc-500 text-xs">{data.itemCount} {data.itemCount === 1 ? 'item' : 'items'}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate total equipment electric consumption (not including gas items)
  const equipmentElectricTotal = useMemo(() => {
    return categories
      .filter(cat => !cat.isGas)
      .reduce((sum, cat) => sum + cat.value, 0);
  }, [categories]);

  return (
    <div className="p-4 flex flex-col h-full bg-black text-white">
      <div className="mb-4 flex flex-col gap-2">
        <h3 className="text-lg font-medium text-center">END-USE BREAKDOWN</h3>
        
        {/* Building info summary */}
        <div className="bg-zinc-800/70 rounded-md p-2 flex flex-col gap-1">
          {/* Apartment count */}
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Building Units:</span>
            <span className="text-indigo-300 font-bold">{apartmentCount > 0 ? `${apartmentCount} apartments` : "Unknown"}</span>
          </div>
          
          {/* Electric usage comparison */}
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Actual Usage:</span>
            <span className="text-blue-300 font-bold">
              {actualElectricUsage ? `${Math.round(actualElectricUsage).toLocaleString()} kWh` : "N/A"}
            </span>
          </div>
          
          {/* Equipment total */}
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Equipment Total:</span>
            <span className="text-green-300 font-bold">{Math.round(equipmentElectricTotal).toLocaleString()} kWh</span>
          </div>
          
          {/* Usage variance with enhanced display */}
          {actualElectricUsage && actualElectricUsage > 0 && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Variance:</span>
                <span className="font-bold">{Math.round(actualElectricUsage - equipmentElectricTotal).toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400"></span>
                {(() => {
                  const variancePercent = Math.round((actualElectricUsage - equipmentElectricTotal) / actualElectricUsage * 100);
                  const absVariancePercent = Math.abs(variancePercent);
                  let color = 'text-green-300';
                  let label = 'Good';
                  
                  if (absVariancePercent > 25) {
                    color = 'text-red-300';
                    label = 'High';
                  } else if (absVariancePercent > 10) {
                    color = 'text-amber-300';
                    label = 'Medium';
                  }
                  
                  return (
                    <span className={`font-bold ${color}`}>
                      {variancePercent}% ({label})
                    </span>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </div>
      
      {electricTotal > 0 ? (
        <>
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold">{Math.round(electricTotal).toLocaleString()}</h2>
            <p className="text-sm text-zinc-400">Electric Annual kWh</p>
            
            <div className="flex justify-center gap-4 mt-2 text-xs">
              <span className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                Electric: {Math.round(electricTotal).toLocaleString()} kWh ({totalKwh > 0 ? (electricTotal/totalKwh*100).toFixed(1) : 100}%)
              </span>
              {gasTotal > 0 && (
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div>
                  Gas: {Math.round(gasTotal).toLocaleString()} kWh ({(gasTotal/totalKwh*100).toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
          
          {/* Chart */}
          <div className="flex-grow mb-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={electricOnlyCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={100}
                  paddingAngle={1}
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {electricOnlyCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#A0A0A0'} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top categories */}
          <div className="space-y-2">
            <h4 className="text-sm text-zinc-300 font-medium">Top Electric Categories</h4>
            {electricOnlyCategories.slice(0, 4).map((category, index) => (
              <div key={index} className="flex items-center bg-zinc-800 p-2 rounded-md">
                <div className="w-2 h-2 rounded-full mr-2" 
                  style={{backgroundColor: COLORS[category.name as keyof typeof COLORS] || '#A0A0A0'}} 
                />
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <div className="text-sm text-zinc-300">{category.name}</div>
                    <div className="text-sm text-zinc-400">{category.percentage?.toFixed(1)}%</div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-xs text-zinc-500">{category.itemCount} items</div>
                    <div className="text-xs text-zinc-500">{Math.round(category.value).toLocaleString()} kWh</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-2">No energy data available</p>
            <p className="text-zinc-500 text-sm">Add equipment to see the breakdown</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EndUseBreakdown;