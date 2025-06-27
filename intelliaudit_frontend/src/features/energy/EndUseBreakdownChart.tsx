import React, { useEffect, useRef, useState } from 'react';
import { EndUseBreakdown } from '@/services/energy-analysis';
import { PieChart, BarChart } from 'lucide-react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface EndUseBreakdownChartProps {
  data: EndUseBreakdown;
  chartType?: 'pie' | 'bar';
  height?: number;
  width?: number;
  className?: string;
}

export const EndUseBreakdownChart: React.FC<EndUseBreakdownChartProps> = ({
  data,
  chartType = 'pie',
  height = 200,
  width = 200,
  className = '',
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [localChartType, setLocalChartType] = useState<'pie' | 'bar'>(chartType);

  // Colors for different end uses - you can customize these
  const colors = [
    '#4cd964', // Heating
    '#5ac8fa', // Cooling
    '#007aff', // Lighting
    '#ff2d55', // Plug loads
    '#ff9500', // Domestic hot water
    '#ffcc00', // Ventilation
    '#8e8e93', // Other
    '#34aadc', // Office equipment
    '#5856d6', // Misc electronics
    '#af52de', // Exterior lighting
  ];

  useEffect(() => {
    if (!chartRef.current || !data || !data.breakdown) return;

    // Get the breakdown data from the breakdown array
    const filteredData = data.breakdown
      .filter(item => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);

    const labels = filteredData.map(item => item.category);
    const values = filteredData.map(item => item.percentage);
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: localChartType,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, values.length),
          borderWidth: 1,
          borderColor: '#ffffff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${value}%`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, localChartType]);

  if (!data) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <canvas ref={chartRef} />
      <div className="absolute top-0 right-0 flex items-center space-x-2 p-1">
        <button 
          onClick={() => localChartType !== 'pie' && setLocalChartType('pie')}
          className={`text-xs p-1 rounded-full ${localChartType === 'pie' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
        >
          <PieChart size={14} />
        </button>
        <button 
          onClick={() => localChartType !== 'bar' && setLocalChartType('bar')}
          className={`text-xs p-1 rounded-full ${localChartType === 'bar' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
        >
          <BarChart size={14} />
        </button>
      </div>
    </div>
  );
}; 