import React, { useState, useEffect, useRef } from 'react';
import { BarChart as ChartIcon, LineChart, Droplet } from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { Box } from '@/components/ui/box';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchMonthlyUtilityData } from '@/services/energy-analysis';
import { useTheme } from "@/hooks/useTheme";

// Register Chart.js components
Chart.register(...registerables);

interface MonthlyWaterChartContainerProps {
  projectId: string;
  className?: string;
}

export const MonthlyWaterChartContainer: React.FC<MonthlyWaterChartContainerProps> = ({
  projectId,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
      
  const [waterData, setWaterData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCost, setShowCost] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('usage');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch water data
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        // Note: Backend uses 'Municipally Supplied Potable Water - Mixed Indoor/Outdoor' meter type
        const data = await fetchMonthlyUtilityData(projectId, 'water');

        // Filter out December 2023 data point as requested
        const filteredData = data.filter(item => !(item.month === 12 && item.year === 2023));
        console.log('Filtered out Dec 2023 from water data');

        setWaterData(filteredData);
      } catch (error) {
        console.error('Error fetching water data:', error);
        setWaterData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Create and update chart
  useEffect(() => {
    if (!chartRef.current || isLoading || waterData.length === 0) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Filter out any invalid month data
    const validWaterData = waterData.filter(d => d.month >= 1 && d.month <= 12);

    // Process data to create labels and datasets
    const processedMonths = new Set<string>();
    const uniqueLabels: string[] = [];
    const labelMap: { [key: string]: number } = {};

    // First pass - create a Set of all unique year/month combinations
    validWaterData.forEach(point => {
      const uniqueKey = `${point.year}-${point.month}`;
      processedMonths.add(uniqueKey);
    });

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

    // Prepare datasets
    const waterValues: (number | null)[] = new Array(uniqueLabels.length).fill(null);

    // Fill in the data arrays
    validWaterData.forEach(point => {
      const uniqueKey = `${point.year}-${point.month}`;
      const index = labelMap[uniqueKey];
      if (index !== undefined) {
        waterValues[index] = showCost ? point.cost : point.usage;
      }
    });

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Change in dark and light mode
    const textColor = isDarkMode ? '#ebebeb' : '#1f2937';

    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels: uniqueLabels,
        datasets: [
          {
            label: showCost ? 'Water Cost ($)' : 'Water Usage (HCF)',
            data: waterValues,
            backgroundColor: 'rgba(59, 130, 246, 0.5)', // Blue - blue-500
            borderColor: 'rgb(59, 130, 246)',           // Blue - blue-500
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: showCost ? 'Cost ($)' : 'Usage (HCF)',
              color: textColor
            },
            ticks: {
              color: textColor
            },
            grid: {
              // color: 'rgba(255, 255, 255, 0.1)'
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month',
              color: textColor
            },
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
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
                return showCost
                  ? `$${value?.toLocaleString() || 0}`
                  : `${value?.toLocaleString() || 0} HCF`;
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
  }, [waterData, chartType, showCost, isLoading]);

  if (isLoading) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-muted-foreground">Loading water data...</p>
        </div>
      </Box>
    );
  }

  if (waterData.length === 0) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="text-center">
          <Droplet className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Water Data Available</h3>
          <p className="text-muted-foreground">There is no monthly water data available for this project.</p>
        </div>
      </Box>
    );
  }

  return (
    <Box intensity="subtle" className={`p-4 md:p-6 bg-card ${className}`}>
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
          <div className="flex items-center">
            <Droplet className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-xl font-semibold">Monthly Water Tracking</h3>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="usage" onClick={() => setShowCost(false)}>
                <Droplet className="w-4 h-4 mr-2" />
                Usage
              </TabsTrigger>
              <TabsTrigger value="cost" onClick={() => setShowCost(true)}>
                <Droplet className="w-4 h-4 mr-2" />
                Cost
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="relative w-full h-[300px] md:h-[400px]">
          <canvas ref={chartRef} />
          <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
            <button
              onClick={() => setChartType('bar')}
              className={`text-xs p-1.5 rounded-full ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              title="Bar Chart"
            >
              <ChartIcon size={16} />
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

        <div className="text-sm text-muted-foreground mt-4 text-center">
          {showCost
            ? "Monthly cost breakdown for water usage"
            : "Monthly water usage tracking in HCF (hundred cubic feet)"}
        </div>
      </div>
    </Box>
  );
};