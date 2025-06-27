import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/services/common/axios-config';
import { Chart, registerables } from 'chart.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box } from '@/components/ui/box';
import { Thermometer, Snowflake, BarChart, LineChart } from 'lucide-react';
import { safelyAccessArray, safelyAccessProperty } from '@/utils/response-helpers';

// Register Chart.js components
Chart.register(...registerables);

interface WeatherDashboardCardProps {
  projectId: string;
  className?: string;
}

interface WeatherDataPoint {
  month: number;
  year: number;
  hdd: number;
  cdd: number;
}

// Month names for the x-axis
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const WeatherDashboardCard: React.FC<WeatherDashboardCardProps> = ({
  projectId,
  className = '',
}) => {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hdd');
  const [showHDD, setShowHDD] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Fetch weather data when component mounts
  useEffect(() => {
    if (!projectId) return;

    const fetchWeatherData = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/api/weather/project?projectId=${projectId}`);
        const responseData = safelyAccessProperty<unknown[]>(response, 'data', []);
        const hasData = Array.isArray(responseData) && responseData.length > 0;
        
        if (hasData) {
          setWeatherData(responseData as any[]);
          console.log('Weather data loaded:', responseData);
        } else {
          console.warn('No weather data available for project:', projectId);
          setWeatherData([]);
        }
      } catch (error) {
        console.error('Failed to load weather data:', error);
        setWeatherData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, [projectId]);

  // Prepare and render chart
  useEffect(() => {
    if (!chartRef.current || isLoading || !weatherData.length) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Process the data for the chart
    const processedData: WeatherDataPoint[] = [];
    
    if (weatherData.length > 0 && weatherData[0]?.monthly_data) {
      // Sort monthly data by month number and filter valid months
      const monthlyData = [...weatherData[0].monthly_data]
        .filter((item: any) => item.month >= 1 && item.month <= 12)
        .sort((a: any, b: any) => a.month - b.month);
      
      // Transform into chart data format
      monthlyData.forEach((item: any) => {
        processedData.push({
          month: item.month,
          year: item.base_year || new Date().getFullYear(),
          hdd: item.base_year_hdd || 0,
          cdd: item.base_year_cdd || 0,
        });
      });
    }
    
    // Create labels for x-axis (Month Year)
    const labels = processedData.map(item => {
      return `${MONTH_NAMES[item.month - 1]} ${item.year}`;
    });
    
    // Prepare datasets
    const hddValues = processedData.map(item => item.hdd);
    const cddValues = processedData.map(item => item.cdd);

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Heating Degree Days (HDD)',
            data: hddValues,
            backgroundColor: 'rgba(59, 130, 246, 0.5)', // Blue - blue-500
            borderColor: 'rgb(59, 130, 246)',           // Blue - blue-500
            borderWidth: 1,
            hidden: !showHDD
          },
          {
            label: 'Cooling Degree Days (CDD)',
            data: cddValues,
            backgroundColor: 'rgba(16, 185, 129, 0.5)', // Green - emerald-500
            borderColor: 'rgb(16, 185, 129)',           // Green - emerald-500
            borderWidth: 1,
            hidden: showHDD
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
              text: 'Degree Days',
              color: '#ebebeb'
            },
            ticks: {
              color: '#ebebeb'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Month',
              color: '#ebebeb'
            },
            ticks: {
              color: '#ebebeb',
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
              color: '#ebebeb',
              padding: 20,
              boxWidth: 12,
              font: {
                size: 12
              },
              filter: function(legendItem) {
                // Only show legend for the active dataset
                return (showHDD && legendItem.text.includes('HDD')) || 
                       (!showHDD && legendItem.text.includes('CDD'));
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${value.toLocaleString()} Degree Days`;
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
  }, [weatherData, isLoading, showHDD, chartType]);

  const currentYear = weatherData[0]?.monthly_data?.[0]?.base_year || new Date().getFullYear();
  const zipCode = weatherData[0]?.zip_code || 'Unknown';

  if (isLoading) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-muted-foreground">Loading weather data...</p>
        </div>
      </Box>
    );
  }

  if (!weatherData.length || !weatherData[0]?.monthly_data) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No Weather Data Available</h3>
          <p className="text-muted-foreground">There is no weather data available for this project.</p>
        </div>
      </Box>
    );
  }

  return (
    <Box intensity="subtle" className={`p-4 md:p-6 bg-card ${className}`}>
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
          <div>
            <h3 className="text-xl font-semibold">Weather Conditions ({currentYear})</h3>
            <p className="text-sm text-muted-foreground">
              ZIP Code: {zipCode}
            </p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger 
                value="hdd" 
                onClick={() => setShowHDD(true)}
              >
                <Thermometer className="w-4 h-4 mr-2" />
                Heating
              </TabsTrigger>
              <TabsTrigger 
                value="cdd" 
                onClick={() => setShowHDD(false)}
              >
                <Snowflake className="w-4 h-4 mr-2" />
                Cooling
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="w-full h-[300px] md:h-[400px] relative">
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
        
        <div className="text-sm text-muted-foreground mt-4 text-center">
          {showHDD 
            ? `Heating Degree Days (HDD) for ${currentYear}` 
            : `Cooling Degree Days (CDD) for ${currentYear}`}
        </div>
      </div>
    </Box>
  );
}; 