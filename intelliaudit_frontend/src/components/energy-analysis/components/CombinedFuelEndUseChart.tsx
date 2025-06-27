import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CombinedEndUseData, ConversionFactors } from '../types/energyAnalysis.types';

// Color palette for the chart
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#A4DE6C', '#D0ED57', '#FFC658', '#FF7300'
];

interface CombinedFuelEndUseChartProps {
  data: CombinedEndUseData[];
  conversionFactors: ConversionFactors;
}

export const CombinedFuelEndUseChart: React.FC<CombinedFuelEndUseChartProps> = ({ 
  data,
  conversionFactors 
}) => {
  // Convert all energy to kBtu for combined visualization
  const chartData = useMemo(() => {
    return data.map(item => {
      // Convert kWh to kBtu
      const electricKbtu = item.kWh * conversionFactors.kWhTokBtu;
      // Convert therms to kBtu
      const gasKbtu = item.therms * conversionFactors.thermsTokBtu;
      // Total kBtu
      const totalKbtu = electricKbtu + gasKbtu;
      
      return {
        name: item.name,
        value: Math.round(totalKbtu),
        electricKbtu: Math.round(electricKbtu),
        gasKbtu: Math.round(gasKbtu),
        percentOfTotal: 0, // Will be calculated below
      };
    }).filter(item => item.value > 0); // Filter out zero values
  }, [data, conversionFactors]);

  // Calculate total kBtu and percentages
  const totalKbtu = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0)
  , [chartData]);

  // Add percentage to each item
  useMemo(() => {
    chartData.forEach(item => {
      item.percentOfTotal = Math.round((item.value / totalKbtu) * 100);
    });
  }, [chartData, totalKbtu]);

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-3 shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p>Total: {data.value.toLocaleString()} kBtu ({data.percentOfTotal}%)</p>
          <p>Electric: {data.electricKbtu.toLocaleString()} kBtu</p>
          <p>Gas: {data.gasKbtu.toLocaleString()} kBtu</p>
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
          <Badge variant="outline">kBtu</Badge>
        </div>
        <CardDescription>
          Total: {totalKbtu.toLocaleString()} kBtu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percentOfTotal }) => `${name} (${percentOfTotal}%)`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}; 