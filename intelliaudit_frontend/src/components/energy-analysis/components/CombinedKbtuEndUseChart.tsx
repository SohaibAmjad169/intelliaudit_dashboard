import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CombinedEndUseData } from '../types/energyAnalysis.types';

// Color palette for the chart - purples for combined energy
const COLORS = [
  '#8884d8', '#9575cd', '#7e57c2', '#673ab7', '#5e35b1',
  '#512da8', '#4527a0', '#311b92', '#b39ddb', '#9575cd'
];

// Conversion factors
const KWH_TO_KBTU = 3.412;
const THERM_TO_KBTU = 100;

interface CombinedKbtuEndUseChartProps {
  data: CombinedEndUseData[];
}

export const CombinedKbtuEndUseChart: React.FC<CombinedKbtuEndUseChartProps> = ({ data }) => {
  // Process data to convert kWh and therms to kBtu
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data
      .map(item => {
        // Convert kWh to kBtu and therms to kBtu, then add them
        const kWhInKbtu = (item.kWh || 0) * KWH_TO_KBTU;
        const thermsInKbtu = (item.therms || 0) * THERM_TO_KBTU;
        const totalKbtu = kWhInKbtu + thermsInKbtu;
        
        return {
          name: item.name,
          value: totalKbtu, // Combined value in kBtu
          kWhInKbtu,
          thermsInKbtu,
          totalKbtu,
          percentOfTotal: 0 // Will be calculated below
        };
      })
      .filter(item => item.value > 0) // Filter out zero values
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data]);

  // Calculate total kBtu and percentages
  const totalKbtu = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0)
  , [chartData]);

  // Add percentage to each item
  useMemo(() => {
    if (chartData.length > 0 && totalKbtu > 0) {
      chartData.forEach(item => {
        item.percentOfTotal = Math.round((item.value / totalKbtu) * 100);
      });
    }
  }, [chartData, totalKbtu]);

  // Format kBtu with commas and rounded to whole numbers
  const formatKbtu = (kbtu: number) => Math.round(kbtu).toLocaleString();

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-3 shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{formatKbtu(data.totalKbtu)} kBtu ({data.percentOfTotal}%)</p>
          <p className="text-xs text-muted-foreground">Electric: {formatKbtu(data.kWhInKbtu)} kBtu</p>
          <p className="text-xs text-muted-foreground">Gas: {formatKbtu(data.thermsInKbtu)} kBtu</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Combined Fuel End-Use Breakdown</CardTitle>
          <Badge variant="outline" className="bg-purple-50">kBtu</Badge>
        </div>
        <CardDescription>
          Total: {formatKbtu(totalKbtu)} kBtu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row items-center">
          <div className="h-[400px] w-3/5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={150}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-2/5 pl-4">
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-4 h-4 mr-2 rounded-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex justify-between w-full">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.percentOfTotal}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 