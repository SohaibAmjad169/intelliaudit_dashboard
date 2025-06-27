import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CombinedEndUseData } from '../types/energyAnalysis.types';

// Color palette for the chart - oranges for gas
const COLORS = [
  '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100',
  '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00'
];

interface ThermsEndUseChartProps {
  data: CombinedEndUseData[];
}

export const ThermsEndUseChart: React.FC<ThermsEndUseChartProps> = ({ data }) => {
  // Process data to include only therms values
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data
      .map(item => ({
        name: item.name,
        value: item.therms || 0,
        percentOfTotal: 0 // Will be calculated below
      }))
      .filter(item => item.value > 0) // Filter out zero values
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data]);

  // Calculate total therms and percentages
  const totalTherms = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0)
  , [chartData]);

  // Add percentage to each item
  useMemo(() => {
    if (chartData.length > 0 && totalTherms > 0) {
      chartData.forEach(item => {
        item.percentOfTotal = Math.round((item.value / totalTherms) * 100);
      });
    }
  }, [chartData, totalTherms]);

  // Format therms with commas and rounded to whole numbers
  const formatTherms = (therms: number) => Math.round(therms).toLocaleString();

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-3 shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">{formatTherms(data.value)} therms ({data.percentOfTotal}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Gas End-Use Breakdown</CardTitle>
          <Badge variant="outline" className="bg-amber-50">therms</Badge>
        </div>
        <CardDescription>
          Total: {formatTherms(totalTherms)} therms
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