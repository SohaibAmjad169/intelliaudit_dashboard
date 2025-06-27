import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { BarChart, LineChart } from 'lucide-react';

Chart.register(...registerables);

interface MonthlyDataPoint {
  month: number;
  year: number;
  usage: number;
  cost: number;
}

interface MonthlyEnergyChartProps {
  electricData: MonthlyDataPoint[];
  naturalGasData: MonthlyDataPoint[];
  height?: number | string;
  className?: string;
  showCost?: boolean;
  customCostData?: MonthlyDataPoint[];
  chartTitle?: string;
  usageLabel?: string;
  costLabel?: string;
}

export const MonthlyEnergyChart: React.FC<MonthlyEnergyChartProps> = ({
  electricData,
  naturalGasData,
  height = 400,
  className = '',
  showCost = false,
  customCostData = [],
  chartTitle = '',
  usageLabel = '',
  costLabel = '',
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Filter out any invalid month data
    const validElectricData = electricData.filter(d => d.month >= 1 && d.month <= 12);
    const validNaturalGasData = naturalGasData.filter(d => d.month >= 1 && d.month <= 12);
    const validCostData = customCostData.filter(d => d.month >= 1 && d.month <= 12);
    
    console.log('Valid electric data count:', validElectricData.length);
    console.log('Valid natural gas data count:', validNaturalGasData.length);
    
    // Process data to create labels and datasets
    const processedMonths = new Set<string>();
    const uniqueLabels: string[] = [];
    const labelMap: { [key: string]: number } = {};
    
    // First pass - create a Set of all unique year/month combinations from all datasets
    [...validElectricData, ...validNaturalGasData, ...validCostData].forEach(point => {
      const uniqueKey = `${point.year}-${point.month}`;
      processedMonths.add(uniqueKey);
    });
    
    console.log('Unique month count:', processedMonths.size);
    console.log('Unique months:', Array.from(processedMonths));
    
    // Convert the set to an array and sort
    const sortedMonths = Array.from(processedMonths).map(key => {
      const [year, month] = key.split('-').map(Number);
      return { year, month };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Create labels for x-axis (Month Year)
    sortedMonths.forEach((point, index) => {
      const uniqueKey = `${point.year}-${point.month}`;
      const label = `${new Date(0, point.month - 1).toLocaleString('default', { month: 'short' })} ${point.year}`;
      
      labelMap[uniqueKey] = index;
      uniqueLabels.push(label);
    });
    
    console.log('Label count:', uniqueLabels.length);
    console.log('Labels:', uniqueLabels);
    
    // Prepare datasets
    const primaryValues: (number | null)[] = new Array(uniqueLabels.length).fill(null);
    const secondaryValues: (number | null)[] = new Array(uniqueLabels.length).fill(null);
    const costValues: (number | null)[] = new Array(uniqueLabels.length).fill(null);
    
    // Fill in the data arrays
    validElectricData.forEach(point => {
      const uniqueKey = `${point.year}-${point.month}`;
      const index = labelMap[uniqueKey];
      if (index !== undefined) {
        primaryValues[index] = showCost ? point.cost : point.usage;
      }
    });
    
    validNaturalGasData.forEach(point => {
      const uniqueKey = `${point.year}-${point.month}`;
      const index = labelMap[uniqueKey];
      if (index !== undefined) {
        // Convert therms to kWh equivalent if showing usage
        secondaryValues[index] = showCost ? point.cost : (point.usage * 29.3);
      }
    });

    // Fill in cost data if provided
    validCostData.forEach(point => {
      const uniqueKey = `${point.year}-${point.month}`;
      const index = labelMap[uniqueKey];
      if (index !== undefined) {
        costValues[index] = point.cost;
      }
    });

    // Create datasets array
    const datasets = [];
    
    // Add electric/primary dataset if it has values
    if (validElectricData.length > 0) {
      datasets.push({
        label: usageLabel || (showCost ? 'Electric Cost ($)' : 'Electric Usage (kWh)'),
        data: primaryValues,
        backgroundColor: 'rgba(34, 211, 238, 0.7)', // Cyan-400
        borderColor: 'rgb(34, 211, 238)',
        borderWidth: 1,
      });
    }
    
    // Add gas/secondary dataset if it has values
    if (validNaturalGasData.length > 0) {
      datasets.push({
        label: showCost ? 'Natural Gas Cost ($)' : 'Natural Gas Usage (therms)',
        data: secondaryValues,
        backgroundColor: 'rgba(251, 191, 36, 0.7)', // Amber-400
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 1,
      });
    }
    
    // Add cost dataset if customCostData is provided
    if (validCostData.length > 0) {
      datasets.push({
        label: costLabel || 'Cost ($)',
        data: costValues,
        backgroundColor: 'rgba(99, 102, 241, 0.7)', // Indigo-500 (for electric cost, if needed)
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        yAxisID: 'y1',
      });
    }

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Determine if we need a separate y-axis for cost values
    const needsDualAxis = validCostData.length > 0;
    
    // Set up y-axes configuration
    const yAxes: any = {
      y: {
        beginAtZero: true,
        position: 'left',
        title: {
          display: true,
          text: usageLabel || (showCost ? 'Cost ($)' : 'Usage (kWh)'),
          color: '#4a5568'
        },
        ticks: {
          color: '#4a5568'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    };
    
    // Add secondary y-axis for cost if needed
    if (needsDualAxis) {
      yAxes.y1 = {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: costLabel || 'Cost ($)',
          color: '#4a5568'
        },
        ticks: {
          color: '#4a5568'
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      };
    }

    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels: uniqueLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          ...yAxes,
          x: {
            title: {
              display: true,
              text: 'Month',
              color: '#4a5568'
            },
            ticks: {
              color: '#4a5568',
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        plugins: {
          title: {
            display: !!chartTitle,
            text: chartTitle,
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#4a5568',
            padding: {
              top: 10,
              bottom: 20
            }
          },
          legend: {
            position: 'top',
            labels: {
              color: '#4a5568',
              padding: 20,
              boxWidth: 12,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                // For cost datasets, use $ formatting
                if (context.datasetIndex === datasets.length - 1 && needsDualAxis) {
                  return `$${value?.toLocaleString() || 0}`;
                }
                // For usage datasets, use appropriate units
                return showCost
                  ? `$${value?.toLocaleString() || 0}`
                  : `${value?.toLocaleString() || 0} ${context.datasetIndex === 0 ? 'kWh' : 'kWh eq.'}`;
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
  }, [electricData, naturalGasData, chartType, showCost, customCostData, chartTitle, usageLabel, costLabel]);

  if (!electricData.length && !naturalGasData.length) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }

  return (
    <div className={`relative`} style={{ height }}>
      <canvas ref={chartRef} />
      <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
        <button 
          onClick={() => setChartType('bar')}
          className={`text-xs p-1.5 rounded-full ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          title="Bar Chart"
        >
          <BarChart size={16} />
        </button>
        <button 
          onClick={() => setChartType('line')}
          className={`text-xs p-1.5 rounded-full ${chartType === 'line' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          title="Line Chart"
        >
          <LineChart size={16} />
        </button>
      </div>
    </div>
  );
}; 