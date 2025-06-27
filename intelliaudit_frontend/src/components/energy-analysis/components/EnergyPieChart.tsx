import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface DataItem {
  name: string;
  value: number;
  percentage: number;
}

interface EnergyPieChartProps {
  title: string;
  data: DataItem[];
  colorScheme?: 'blue' | 'red' | 'mixed';
}

export const EnergyPieChart: React.FC<EnergyPieChartProps> = ({
  title,
  data,
  colorScheme = 'mixed'
}) => {
  // Color schemes
  const colorSets = {
    blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#2563eb', '#1d4ed8', '#1e40af'],
    red: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#dc2626', '#b91c1c', '#991b1b'],
    mixed: [
      '#3b82f6', // blue
      '#ef4444', // red
      '#f97316', // orange
      '#84cc16', // lime
      '#06b6d4', // cyan
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#14b8a6', // teal
      '#6366f1', // indigo
      '#f59e0b', // amber
      '#10b981', // emerald
      '#d946ef'  // fuchsia
    ]
  };

  // Choose color set based on prop
  const colors = colorSets[colorScheme];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-muted p-2 rounded shadow-md">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{payload[0].value.toLocaleString()} ({payload[0].payload.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-sm">
            <div 
              className="w-3 h-3 mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate">{entry.value}</span>
            <span className="ml-1 text-muted-foreground">
              ({data.find(item => item.name === entry.value)?.percentage}%)
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percentage }) => `${name} ${percentage}%`}
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={renderCustomizedLegend}
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}; 