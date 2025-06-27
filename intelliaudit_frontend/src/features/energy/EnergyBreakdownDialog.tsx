import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EquipmentItem } from './types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getWattageAsNumber } from '@/features/energy/utils/equipment';

interface EnergyBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: EquipmentItem[];
  totalApartmentCount: number;
  isApartmentEquipment: (item: EquipmentItem) => boolean;
}

// Helper function to get color based on calculation type
// Commented out as it's currently unused
/* const getCalculationColor = (calculationType: string) => {
  switch (calculationType?.toLowerCase()) {
    case 'estimated':
      return 'text-amber-600';
    case 'measured':
      return 'text-green-600';
    case 'calculated':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}; */

// Colors for the pie chart
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

// Custom tooltip for the pie chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 rounded-md shadow-md">
        <p className="font-medium capitalize">{payload[0].name}</p>
        <p className="text-sm">{`${payload[0].value.toLocaleString()} kWh (${payload[0].payload.percentage}%)`}</p>
      </div>
    );
  }
  return null;
};

export const EnergyBreakdownDialog: React.FC<EnergyBreakdownDialogProps> = ({
  open,
  onOpenChange,
  equipment,
  totalApartmentCount,
  isApartmentEquipment
}) => {
  // Calculate energy breakdown by category using the same logic as EquipmentRow
  const calculateEnergyBreakdown = () => {
    if (!equipment || equipment.length === 0) return {};
    
    const breakdown: Record<string, number> = {};
    
    equipment.forEach(item => {
      const isApartment = isApartmentEquipment(item);
      const quantity = item.quantity || 1;
      let itemKwh = 0;
      
      // Skip if no wattage or capacity
      if (!item.wattage && !item.capacity) return;
      
      // Determine category
      let category = item.category || 'Other';
      if (category === 'Unknown' || !category) {
        if (item.equipment_type?.toLowerCase().includes('light')) {
          category = 'Lighting';
        } else if (item.equipment_type?.toLowerCase().includes('heat') || 
                  item.equipment_type?.toLowerCase().includes('cool') ||
                  item.equipment_type?.toLowerCase().includes('furnace')) {
          category = 'HVAC';
        } else if (item.equipment_type?.toLowerCase().includes('water')) {
          category = 'DHW';
        } else if (item.equipment_type?.toLowerCase().includes('refrigerator') ||
                  item.equipment_type?.toLowerCase().includes('washer') ||
                  item.equipment_type?.toLowerCase().includes('dryer') ||
                  item.equipment_type?.toLowerCase().includes('dishwasher') ||
                  item.equipment_type?.toLowerCase().includes('stove') ||
                  item.equipment_type?.toLowerCase().includes('oven')) {
          category = 'Appliance';
        } else {
          category = 'Other';
        }
      }
      
      // Calculate kWh using the same logic as EquipmentRow
      if (item.wattage) {
        const wattage = getWattageAsNumber(item);
        // For electrical equipment: W × hours × weeks ÷ 1000 = kWh
        const weeklyHours = isApartment ? 28 : 84;
        itemKwh = (wattage * quantity * weeklyHours * 52) / 1000;
      } else if (item.capacity && item.equipment_type?.toLowerCase().includes('water heater')) {
        // For water heaters: Use a more accurate formula
        const gallons = parseFloat(item.capacity.toString()) || 0;
        if (gallons > 0) {
          // Daily energy use per apartment (kWh)
          const dailyUse = (60 * 8.33 * 70) / (3412 * 0.6);
          // Annual energy use (kWh)
          itemKwh = dailyUse * 365 * quantity;
        }
      } else if (item.capacity && item.equipment_type?.toLowerCase().includes('furnace')) {
        // For furnaces: kBtu/h is the heating capacity
        const kBtuPerHour = parseFloat(item.capacity.toString()) || 0;
        if (kBtuPerHour > 0) {
          // Convert kBtu/h to kW (1 kBtu/h = 0.293 kW)
          const kW = kBtuPerHour * 0.293;
          // Assume furnace runs ~1000 hours per year in heating season
          itemKwh = kW * 1000 * quantity;
        }
      } else if (item.capacity) {
        // Generic capacity-based calculation with a more reasonable factor
        const value = parseFloat(item.capacity.toString()) || 0;
        const weeklyHours = isApartment ? 28 : 84;
        if (value > 0) {
          itemKwh = value * quantity * weeklyHours * 0.1; // Using a more conservative factor
        }
      }
      
      // For apartment items, multiply by the number of apartments
      if (isApartment) {
        itemKwh *= totalApartmentCount;
      }
      
      // Add to breakdown
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += itemKwh;
    });
    
    return breakdown;
  };
  
  const breakdown = calculateEnergyBreakdown();
  const totalEnergy = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  
  // Prepare data for pie chart
  const chartData = Object.entries(breakdown)
    .filter(([_, value]) => value > 0)
    .map(([category, value], index) => ({
      name: category,
      value: Math.round(value),
      percentage: Math.round((value / totalEnergy) * 100),
      color: COLORS[index % COLORS.length]
    }));
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Energy Use Breakdown</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {totalEnergy > 0 ? (
            <Tabs defaultValue="chart">
              <TabsList className="mb-4">
                <TabsTrigger value="chart">Chart View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        formatter={(value) => <span className="capitalize">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="table">
                <div className="space-y-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-2">Category</th>
                        <th className="text-right py-2">Annual kWh</th>
                        <th className="text-right py-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(breakdown)
                        .sort((a, b) => b[1] - a[1]) // Sort by value descending
                        .map(([category, value]) => (
                          <tr key={category} className="border-b border-zinc-800">
                            <td className="py-2 capitalize">{category.toLowerCase()}</td>
                            <td className="text-right py-2 text-yellow-400 font-bold">{Math.round(value).toLocaleString()} kWh</td>
                            <td className="text-right py-2">
                              {Math.round((value / totalEnergy) * 100)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center p-6">
              <p>No energy breakdown data available.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add equipment data to see detailed breakdown.
              </p>
            </div>
          )}
          
          {totalEnergy > 0 && (
            <div className="flex justify-between font-bold p-3 border-t">
              <span>Total Energy Use:</span>
              <span className="text-yellow-400">{Math.round(totalEnergy).toLocaleString()} kWh</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 