import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { EnergyBreakdown, EndUseComponent } from '../types/energyAnalysis.types';
import { RotateCcw } from 'lucide-react';

// Colors for the charts
const COLORS = [
  '#10b981', // Refrigeration (emerald-500)
  '#3b82f6', // Cooling (blue-500)
  '#f59e0b', // Lighting (amber-500)
  '#ef4444', // Cooking (red-500)
  '#8b5cf6', // Office Equipment (violet-500)
  '#14b8a6', // Ventilation (teal-500)
  '#ec4899', // Laundry (pink-500)
  '#06b6d4', // Pool/Spa (cyan-500)
  '#84cc16', // Irrigation (lime-500)
  '#94a3b8', // Other (slate-400)
];

// Category order for Ryan's breakdown
const CATEGORY_ORDER = [
  'Refrigeration',
  'Cooling',
  'Lighting',
  'Cooking',
  'Office Equipment',
  'Ventilation',
  'Laundry',
  'Pool/Spa',
  'Irrigation',
  'Other',
];

interface EnergyBreakdownSectionProps {
  energyBreakdown: EnergyBreakdown;
  adjustments: Record<string, number>;
  onAdjustmentChange: (category: string, value: number) => void;
}

export const EnergyBreakdownSection: React.FC<EnergyBreakdownSectionProps> = ({
  energyBreakdown,
  adjustments,
  onAdjustmentChange
}) => {
  const [viewType, setViewType] = useState<'percentage' | 'absolute'>('percentage');
  
  // Apply adjustments to the energy breakdown
  const adjustedBreakdown = useMemo(() => {
    // Create a new object with adjusted values
    const adjustedCategories = { ...energyBreakdown.categories };
    
    // Calculate total before adjustments
    const originalTotal = Object.values(adjustedCategories).reduce(
      (sum, category) => sum + category.kWh, 
      0
    );
    
    // Apply adjustments
    let adjustedTotal = 0;
    for (const [category, data] of Object.entries(adjustedCategories)) {
      const adjustmentFactor = (adjustments[category] || 100) / 100;
      adjustedCategories[category] = {
        ...data,
        kWh: data.kWh * adjustmentFactor,
        adjustmentFactor
      };
      adjustedTotal += adjustedCategories[category].kWh;
    }
    
    // Recalculate percentages
    for (const category of Object.keys(adjustedCategories)) {
      adjustedCategories[category].percentage = 
        (adjustedCategories[category].kWh / adjustedTotal) * 100;
    }
    
    return {
      categories: adjustedCategories,
      total: {
        ...energyBreakdown.total,
        estimated: adjustedTotal,
        difference: energyBreakdown.total.actual - adjustedTotal,
        differencePercentage: 
          ((energyBreakdown.total.actual - adjustedTotal) / energyBreakdown.total.actual) * 100
      }
    };
  }, [energyBreakdown, adjustments]);
  
  // Prepare data for charts
  const chartData = useMemo(() => {
    return CATEGORY_ORDER
      .filter(category => adjustedBreakdown.categories[category]?.kWh > 0)
      .map((category, index) => ({
        name: category,
        value: viewType === 'percentage' 
          ? Math.round(adjustedBreakdown.categories[category].percentage) 
          : Math.round(adjustedBreakdown.categories[category].kWh),
        color: COLORS[index % COLORS.length]
      }));
  }, [adjustedBreakdown, viewType]);
  
  const handleResetAdjustments = () => {
    // Reset all adjustments to 100%
    CATEGORY_ORDER.forEach(category => {
      if (adjustedBreakdown.categories[category]) {
        onAdjustmentChange(category, 100);
      }
    });
  };
  
  const adjustmentControls = (
    <div className="mt-4 p-4 border rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Adjustment Controls</h3>
        <Button variant="outline" size="sm" onClick={handleResetAdjustments}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>
      
      <div className="space-y-4">
        {CATEGORY_ORDER.filter(category => adjustedBreakdown.categories[category]?.kWh > 0).map((category) => (
          <div key={category} className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3 flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: COLORS[CATEGORY_ORDER.indexOf(category) % COLORS.length] }}
              />
              <span className="text-sm">{category}</span>
            </div>
            <div className="col-span-7">
              <Slider
                value={[adjustments[category] || 100]}
                min={0}
                max={200}
                step={5}
                onValueChange={(values) => onAdjustmentChange(category, values[0])}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                value={adjustments[category] || 100}
                onChange={(e) => onAdjustmentChange(category, parseInt(e.target.value) || 0)}
                className="h-8"
                min={0}
                max={200}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex">
          <Button
            variant={viewType === 'percentage' ? 'default' : 'outline'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewType('percentage')}
          >
            Percentage
          </Button>
          <Button
            variant={viewType === 'absolute' ? 'default' : 'outline'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewType('absolute')}
          >
            kWh
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium">{Math.round(adjustedBreakdown.total.estimated).toLocaleString()} kWh</span>
        </div>
      </div>
      
      <Tabs defaultValue="pie">
        <TabsList className="mb-4">
          <TabsTrigger value="pie">Pie Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pie" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={1}
                dataKey="value"
                label={({ name, percent }) => 
                  viewType === 'percentage' 
                    ? `${name} (${(percent * 100).toFixed(0)}%)` 
                    : `${name}`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => 
                  viewType === 'percentage' 
                    ? `${value}%` 
                    : `${value.toLocaleString()} kWh`
                }
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="bar" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 75, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[0, 'dataMax']}
                tickFormatter={(value) => 
                  viewType === 'percentage' 
                    ? `${value}%` 
                    : value >= 1000 
                      ? `${(value / 1000).toFixed(1)}k` 
                      : value.toString()
                }
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={70}
              />
              <Tooltip
                formatter={(value: number) => 
                  viewType === 'percentage' 
                    ? `${value}%` 
                    : `${value.toLocaleString()} kWh`
                }
              />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="table">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Category</th>
                  <th className="text-right py-2 px-4">kWh</th>
                  <th className="text-right py-2 px-4">Percentage</th>
                  <th className="text-right py-2 px-4">Adjustment</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORY_ORDER
                  .filter(category => adjustedBreakdown.categories[category]?.kWh > 0)
                  .map((category) => {
                    const data = adjustedBreakdown.categories[category];
                    return (
                      <tr key={category} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[CATEGORY_ORDER.indexOf(category) % COLORS.length] }}
                            />
                            {category}
                          </div>
                        </td>
                        <td className="text-right py-2 px-4 font-medium">
                          {Math.round(data.kWh).toLocaleString()}
                        </td>
                        <td className="text-right py-2 px-4">
                          {Math.round(data.percentage)}%
                        </td>
                        <td className="text-right py-2 px-4">
                          {data.adjustmentFactor === 1 
                            ? '-' 
                            : `${(data.adjustmentFactor * 100).toFixed(0)}%`}
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
              <tfoot className="bg-muted/50">
                <tr>
                  <td className="font-bold py-2 px-4">Total</td>
                  <td className="text-right font-bold py-2 px-4">
                    {Math.round(adjustedBreakdown.total.estimated).toLocaleString()}
                  </td>
                  <td className="text-right font-bold py-2 px-4">100%</td>
                  <td className="text-right py-2 px-4">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>
      </Tabs>
      
      {adjustmentControls}
    </div>
  );
}; 