import { useState, useEffect, useRef } from 'react';
import { PlaceholderHighlight } from '@/components/ui/PlaceholderHighlight';
import { fetchMonthlyUtilityData, fetchWeatherData } from '@/services/energy-analysis';
import { MonthlyEnergyChart } from '@/features/energy/MonthlyEnergyChart';
import { Chart, ChartOptions } from 'chart.js';
import { Equipment } from './Equipment';

interface EnergyUseAnalysisProps {
  projectId: string;
  project?: any;
}

// Define the response type from fetchMonthlyUtilityData
interface MonthlyUtilityDataResponse {
  electric?: MonthlyData[];
  gas?: MonthlyData[];
  water?: MonthlyData[];
}

interface MonthlyData {
  month: string;
  usage: number;
  cost: number;
}

interface MonthlyDataPoint {
  month: number;
  year: number;
  usage: number;
  cost: number;
}

interface EndUseCategory {
  category: string;
  percentage: number;
  color: string;
}

interface DegreeDayData {
  month: string;
  cdd: number; // Cooling Degree Days
  hdd: number; // Heating Degree Days
  electricUsage: number; // MMBtu for the chart
}

// Add a PieChart component for our energy use charts
interface PieChartProps {
  title: string;
  data: EndUseCategory[];
  height?: number;
}

const PieChart: React.FC<PieChartProps> = ({ title, data, height = 320 }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Prepare data for Chart.js
    const chartData = {
      labels: data.map(item => item.category),
      datasets: [
        {
          data: data.map(item => item.percentage),
          backgroundColor: data.map(item => item.color),
          borderColor: data.map(item => item.color),
          borderWidth: 1,
        },
      ],
    };
    
    // Create the pie chart
    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,  // Disable the built-in legend
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${context.label}: ${value}%`;
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
  }, [data]);
  
  return (
    <div style={{ height: height }}>
      <canvas ref={chartRef} />
    </div>
  );
};

interface DegreeDayChartProps {
  data: DegreeDayData[];
  height?: number;
}

// Component for rendering the Electric Usage and Degree Days chart
const DegreeDayChart: React.FC<DegreeDayChartProps> = ({ data, height = 400 }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Sort the data by month (1-12)
    const sortedData = [...data].sort((a, b) => {
      const monthA = typeof a.month === 'string' 
        ? new Date(Date.parse(`${a.month} 1, 2023`)).getMonth() + 1
        : a.month;
      const monthB = typeof b.month === 'string'
        ? new Date(Date.parse(`${b.month} 1, 2023`)).getMonth() + 1
        : b.month;
      return monthA - monthB;
    });
    
    // Extract month names, making sure they're sorted properly
    const monthLabels = sortedData.map(item => {
      if (typeof item.month === 'string') {
        return item.month;
      } else {
        return new Date(2023, item.month - 1).toLocaleString('default', { month: 'short' });
      }
    });
    
    // Prepare data series
    const electricData = sortedData.map(item => item.electricUsage);
    const cddData = sortedData.map(item => item.cdd);
    const hddData = sortedData.map(item => item.hdd);
    
    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: 'Electric (MMBtu)',
            data: electricData,
            backgroundColor: 'rgba(251, 191, 36, 0.7)',
            borderColor: 'rgb(251, 191, 36)',
            borderWidth: 1,
            type: 'bar',
            yAxisID: 'y',
            order: 1
          },
          {
            label: 'HDD',
            data: hddData,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            type: 'line',
            yAxisID: 'y1',
            tension: 0.4,
            order: 0
          },
          {
            label: 'CDD',
            data: cddData,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(236, 72, 153, 1)',
            borderWidth: 2,
            type: 'line',
            yAxisID: 'y1',
            tension: 0.4,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Electric Usage (MMBtu)',
              color: '#4a5568'
            },
            ticks: {
              color: '#4a5568'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Degree Days',
              color: '#4a5568'
            },
            ticks: {
              color: '#4a5568'
            },
            grid: {
              drawOnChartArea: false,
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#4a5568',
              padding: 15,
              boxWidth: 10,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      } as ChartOptions
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);
  
  return (
    <div style={{ height: height }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export function EnergyUseAnalysis({ projectId, project }: EnergyUseAnalysisProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [monthlyElectricData, setMonthlyElectricData] = useState<MonthlyData[]>([]);
  const [monthlyGasData, setMonthlyGasData] = useState<MonthlyData[]>([]);
  const [degreeDayData, setDegreeDayData] = useState<DegreeDayData[]>([]);
  
  const [chartElectricData, setChartElectricData] = useState<MonthlyDataPoint[]>([]);
  const [chartGasData, setChartGasData] = useState<MonthlyDataPoint[]>([]);
  const [electricCostData, setElectricCostData] = useState<MonthlyDataPoint[]>([]);
  const [gasCostData, setGasCostData] = useState<MonthlyDataPoint[]>([]);

  // Fetch data when component mounts
  useEffect(() => {
    async function fetchData() {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch electricity data - fetchMonthlyUtilityData returns array
        const electricData = await fetchMonthlyUtilityData(projectId, 'electricity');
        if (Array.isArray(electricData) && electricData.length > 0) {
          setMonthlyElectricData(electricData);
        }
        
        // Fetch natural gas data - fetchMonthlyUtilityData returns array
        const gasData = await fetchMonthlyUtilityData(projectId, 'natural-gas');
        if (Array.isArray(gasData) && gasData.length > 0) {
          setMonthlyGasData(gasData);
        }
        
        // Fetch weather data for degree days
        const weatherData = await fetchWeatherData(projectId);
        if (Array.isArray(weatherData) && weatherData.length > 0) {
          setDegreeDayData(weatherData);
        }
        
        // Fetch monthly utility data - explicitly type the return to fix the error
        const monthlyData = await fetchMonthlyUtilityData(projectId) as MonthlyUtilityDataResponse;
        
        if (monthlyData?.electric && monthlyData.electric.length > 0) {
          setMonthlyElectricData(monthlyData.electric);
          
          // Create usage data points - keep as kWh
          const electricUsageData: MonthlyDataPoint[] = monthlyData.electric.map((item: MonthlyData) => {
            const monthName = item.month;
            const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
            
            return {
              month: monthNumber,
              year: new Date().getFullYear(),
              usage: item.usage, // kWh
              cost: 0
            };
          });
          
          // Create cost data points
          const electricCostData: MonthlyDataPoint[] = monthlyData.electric.map((item: MonthlyData) => {
            const monthName = item.month;
            const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
            
            return {
              month: monthNumber,
              year: new Date().getFullYear(),
              usage: 0,
              cost: item.cost // $
            };
          });
          
          setChartElectricData(electricUsageData);
          setElectricCostData(electricCostData);
        }
        
        if (monthlyData?.gas && monthlyData.gas.length > 0) {
          setMonthlyGasData(monthlyData.gas);
          
          // Create usage data points - keep as therms
          const gasUsageData: MonthlyDataPoint[] = monthlyData.gas.map((item: MonthlyData) => {
            const monthName = item.month;
            const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
            
            return {
              month: monthNumber,
              year: new Date().getFullYear(),
              usage: item.usage, // therms
              cost: 0
            };
          });
          
          // Create cost data points
          const gasCostData: MonthlyDataPoint[] = monthlyData.gas.map((item: MonthlyData) => {
            const monthName = item.month;
            const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
            
            return {
              month: monthNumber,
              year: new Date().getFullYear(),
              usage: 0,
              cost: item.cost // $
            };
          });
          
          setChartGasData(gasUsageData);
          setGasCostData(gasCostData);
        }
        
      } catch (err) {
        console.error('Error fetching energy usage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [projectId]);

  // Format currency
  const formatCurrency = (value: number | null): string => {
    if (value === null) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };
  
  // Format number with commas
  const formatNumber = (value: number | null): string => {
    if (value === null) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Default data for charts if no real data is available
  const defaultElectricityData = [
    { month: 'January', usage: 22000, cost: 4200 },
    { month: 'February', usage: 19000, cost: 3700 },
    { month: 'March', usage: 20000, cost: 3900 },
    { month: 'April', usage: 23000, cost: 4400 },
    { month: 'May', usage: 21000, cost: 4100 },
    { month: 'June', usage: 22000, cost: 4300 },
    { month: 'July', usage: 33000, cost: 6000 },
    { month: 'August', usage: 32000, cost: 5900 },
    { month: 'September', usage: 27000, cost: 5200 },
    { month: 'October', usage: 26000, cost: 5100 },
    { month: 'November', usage: 21000, cost: 4200 },
    { month: 'December', usage: 22000, cost: 4300 }
  ];
  
  const defaultGasData = [
    { month: 'January', usage: 1100, cost: 1150 },
    { month: 'February', usage: 1300, cost: 1350 },
    { month: 'March', usage: 1200, cost: 1250 },
    { month: 'April', usage: 1100, cost: 1150 },
    { month: 'May', usage: 1100, cost: 1150 },
    { month: 'June', usage: 1000, cost: 1050 },
    { month: 'July', usage: 850, cost: 900 },
    { month: 'August', usage: 800, cost: 850 },
    { month: 'September', usage: 750, cost: 800 },
    { month: 'October', usage: 900, cost: 950 },
    { month: 'November', usage: 900, cost: 950 },
    { month: 'December', usage: 1000, cost: 1050 }
  ];

  // Default degree day data from screenshot
  const defaultDegreeDayData: DegreeDayData[] = [
    { month: 'January', cdd: 0, hdd: 300, electricUsage: 75 },
    { month: 'February', cdd: 0, hdd: 280, electricUsage: 65 },
    { month: 'March', cdd: 0, hdd: 260, electricUsage: 65 },
    { month: 'April', cdd: 10, hdd: 120, electricUsage: 80 },
    { month: 'May', cdd: 10, hdd: 60, electricUsage: 75 },
    { month: 'June', cdd: 20, hdd: 10, electricUsage: 75 },
    { month: 'July', cdd: 290, hdd: 0, electricUsage: 110 },
    { month: 'August', cdd: 280, hdd: 0, electricUsage: 110 },
    { month: 'September', cdd: 180, hdd: 0, electricUsage: 90 },
    { month: 'October', cdd: 120, hdd: 0, electricUsage: 90 },
    { month: 'November', cdd: 20, hdd: 30, electricUsage: 75 },
    { month: 'December', cdd: 10, hdd: 130, electricUsage: 75 }
  ];

  // Default end-use data from screenshots
  const defaultCombinedEndUseData: EndUseCategory[] = [
    { category: 'Cooling', percentage: 43, color: '#c74e52' },
    { category: 'Lighting', percentage: 24, color: '#e9a264' },
    { category: 'Cooking', percentage: 15, color: '#4e4469' },
    { category: 'Heating', percentage: 11, color: '#6cabb0' },
    { category: 'Ventilation', percentage: 4, color: '#607c3c' },
    { category: 'Other', percentage: 3, color: '#9ebd61' }
  ];

  const defaultElectricEndUseData: EndUseCategory[] = [
    { category: 'Cooling', percentage: 35, color: '#4a77b5' },
    { category: 'Lighting', percentage: 20, color: '#c04a50' },
    { category: 'Refrigeration', percentage: 18, color: '#97c15c' },
    { category: 'Heating', percentage: 9, color: '#815cc0' },
    { category: 'Office Equipment', percentage: 7, color: '#5cc0c0' },
    { category: 'Laundry', percentage: 5, color: '#e8a15c' },
    { category: 'Ventilation', percentage: 5, color: '#494ca7' },
    { category: 'Other', percentage: 3, color: '#3f3f3f' }
  ];

  const defaultGasEndUseData: EndUseCategory[] = [
    { category: 'Water Heating', percentage: 64, color: '#4a77b5' },
    { category: 'Laundry', percentage: 26, color: '#c04a50' },
    { category: 'Cooking', percentage: 10, color: '#97c15c' }
  ];

  // Use actual data or fallback to defaults
  const electricData = monthlyElectricData.length > 0 ? monthlyElectricData : defaultElectricityData;
  const gasData = monthlyGasData.length > 0 ? monthlyGasData : defaultGasData;
  const degreeData = degreeDayData.length > 0 ? degreeDayData : defaultDegreeDayData;

  // Calculate totals for placeholders
  const defaultElectricityTotal = 294973;
  const defaultElectricityCost = 53095;
  const defaultGasTotal = 12335;
  const defaultGasCost = 12952;

  // Calculate annual totals by summing all monthly values
  const calculateAnnualTotal = (data: MonthlyData[]) => {
    return data.reduce((total, month) => total + month.usage, 0);
  };

  const calculateAnnualCost = (data: MonthlyData[]) => {
    return data.reduce((total, month) => total + month.cost, 0);
  };

  // Calculate annual totals for electricity and gas
  // Log actual data to help diagnose any issues
  useEffect(() => {
    // Only log when we have data
    if (monthlyElectricData.length > 0 || monthlyGasData.length > 0) {
      console.log('Monthly Electric Data:', monthlyElectricData);
      console.log('Monthly Gas Data:', monthlyGasData);
      
      // Calculate and log annual totals
      const elecTotal = monthlyElectricData.reduce((total, month) => total + month.usage, 0);
      const elecCost = monthlyElectricData.reduce((total, month) => total + month.cost, 0);
      const gasTotal = monthlyGasData.reduce((total, month) => total + month.usage, 0);
      const gasCost = monthlyGasData.reduce((total, month) => total + month.cost, 0);
      
      console.log('Annual Electric Usage:', elecTotal, 'kWh');
      console.log('Annual Electric Cost:', elecCost);
      console.log('Annual Gas Usage:', gasTotal, 'therms');
      console.log('Annual Gas Cost:', gasCost);
    }
  }, [monthlyElectricData, monthlyGasData]);

  // Calculate annual totals for fallback data
  const annualElectricUsage = monthlyElectricData.length > 0 
    ? calculateAnnualTotal(monthlyElectricData) 
    : calculateAnnualTotal(defaultElectricityData);
    
  const annualElectricCost = monthlyElectricData.length > 0 
    ? calculateAnnualCost(monthlyElectricData) 
    : calculateAnnualCost(defaultElectricityData);
    
  const annualGasUsage = monthlyGasData.length > 0 
    ? calculateAnnualTotal(monthlyGasData) 
    : calculateAnnualTotal(defaultGasData);
    
  const annualGasCost = monthlyGasData.length > 0 
    ? calculateAnnualCost(monthlyGasData) 
    : calculateAnnualCost(defaultGasData);
  
  // Format values for display
  const formattedElectricUsage = formatNumber(annualElectricUsage);
  const formattedElectricCost = formatNumber(annualElectricCost);
  const formattedGasUsage = formatNumber(annualGasUsage);
  const formattedGasCost = formatNumber(annualGasCost);
  
  // Calculate gas rate (cost per therm)
  const gasRate = annualGasUsage > 0 ? (annualGasCost / annualGasUsage).toFixed(2) : "1.05";

  // Update the renderPieChartPlaceholder function to use the real PieChart component
  const renderPieChart = (title: string, data: EndUseCategory[]) => {
    return (
      <div className="border-2 border-gray-300 p-4 mb-6">
        <h4 className="text-center text-lg font-bold mb-4">{title}</h4>
        
        <div className="flex">
          {/* Chart on the left */}
          <div className="w-2/3">
            <PieChart 
              title={title} 
              data={data} 
              height={320}
            />
          </div>
          
          {/* Legend on the right */}
          <div className="w-1/3 flex flex-col justify-center">
            <div className="grid grid-cols-1 gap-2">
              {data.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-4 h-4 mr-2" style={{ backgroundColor: item.color }}></div>
                  <span>{item.category}: <strong>{item.percentage}%</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // When we have default data, convert it to the format MonthlyEnergyChart expects
  useEffect(() => {
    if (monthlyElectricData.length === 0) {
      // Create usage data points for electricity - keep as kWh
      const electricUsageData: MonthlyDataPoint[] = defaultElectricityData.map((item, index) => {
        const monthName = item.month;
        const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
        
        return {
          month: monthNumber,
          year: new Date().getFullYear(),
          usage: item.usage, // kWh
          cost: 0
        };
      });
      
      // Create cost data points for electricity
      const electricCostData: MonthlyDataPoint[] = defaultElectricityData.map((item, index) => {
        const monthName = item.month;
        const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
        
        return {
          month: monthNumber,
          year: new Date().getFullYear(),
          usage: 0,
          cost: item.cost // $
        };
      });
      
      setChartElectricData(electricUsageData);
      setElectricCostData(electricCostData);
    }
    
    if (monthlyGasData.length === 0) {
      // Create usage data points for gas - keep as therms
      const gasUsageData: MonthlyDataPoint[] = defaultGasData.map((item, index) => {
        const monthName = item.month;
        const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
        
        return {
          month: monthNumber,
          year: new Date().getFullYear(),
          usage: item.usage, // therms
          cost: 0
        };
      });
      
      // Create cost data points for gas
      const gasCostData: MonthlyDataPoint[] = defaultGasData.map((item, index) => {
        const monthName = item.month;
        const monthNumber = new Date(Date.parse(`${monthName} 1, 2023`)).getMonth() + 1;
        
        return {
          month: monthNumber,
          year: new Date().getFullYear(),
          usage: 0,
          cost: item.cost // $
        };
      });
      
      setChartGasData(gasUsageData);
      setGasCostData(gasCostData);
    }
  }, [monthlyElectricData, monthlyGasData]);

  if (isLoading) {
    return <div className="text-center py-6">Loading energy use analysis...</div>;
  }

  return (
    <section className="mb-10">
      <h2 className="text-emerald-600 font-medium">
        Energy Use Analysis
      </h2>
      
      <div className="mb-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          This section summarizes an energy analysis of purchased electricity and natural gas by end-use.
          Section J.5 below includes a tabular summary of electricity and natural gas usage and costs over a
          one (1) year period. Section J.4 offers a detailed analysis of the effects of weather on energy
          consumption.
        </p>
        
        <p className="text-sm leading-relaxed text-muted-foreground italic">
          <strong>Note:</strong> The utility analysis is based on whole building aggregate data (Tenant and common areas).
        </p>
        
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          The following observations, table and graphs summarize the results of the annual electricity and
          natural gas usage and cost analysis.
        </p>
      </div>
      
      {/* Aggregated Electricity Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground">
          1. Aggregated Electricity
        </h3>
        
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          Our audit team reviewed gas and electric utility bills from January through December. During this 
          period, the building consumed {formattedElectricUsage} kWh, or ${formattedElectricCost} worth of electricity. The chart below shows monthly electricity usage and costs.
        </p>
        
        {/* Electricity Chart */}
        <div className="border-2 border-gray-300 p-4 mb-4">
          <h4 className="text-center text-lg font-bold mb-4">Monthly Electric Usage Vs Cost</h4>
          
          {/* Using the updated chart to show electric usage and cost */}
          <MonthlyEnergyChart
            electricData={chartElectricData}  // Electric usage data
            naturalGasData={[]}               // No gas data 
            customCostData={electricCostData} // Electric cost data
            height={320}
            className="bg-white dark:bg-gray-800 rounded-md p-2"
            usageLabel="Electric Usage (kWh)"
            costLabel="Electric Cost ($)"
          />
        </div>
      </div>
      
      {/* Aggregated Natural Gas Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground">
          2. Aggregated Natural Gas
        </h3>
        
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          This building purchases natural gas from the local utility at an estimated rate of ${gasRate}/therm. 
          The building consumed {formattedGasUsage} therms, or ${formattedGasCost} worth of natural gas during the 12 months analyzed. The chart below shows the monthly natural gas usage and costs.
        </p>
        
        {/* Natural Gas Chart */}
        <div className="border-2 border-gray-300 p-4 mb-4">
          <h4 className="text-center text-lg font-bold mb-4">Monthly Gas Usage Vs Cost</h4>
          
          {/* Using the updated chart to show gas usage and cost */}
          <MonthlyEnergyChart
            electricData={chartGasData}    // Gas usage data (using electricData prop)
            naturalGasData={[]}            // No gas data in the naturalGasData prop
            customCostData={gasCostData}   // Gas cost data
            height={320}
            className="bg-white dark:bg-gray-800 rounded-md p-2"
            usageLabel="Gas Usage (therms)"
            costLabel="Gas Cost ($)"
          />
        </div>
      </div>

      {/* Building Energy End Use Charts Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground">
          3. Building Energy End Use Charts
        </h3>

        <Equipment projectId={project.id} project={project} />
        
        {/* <p className="text-sm leading-relaxed text-muted-foreground">
          The following charts show the breakdown of energy use in the building by end-use category. These visualizations help identify the largest energy consumers and potential areas for conservation measures.
        </p>
        
        {/* Combined Fuel End-Use Breakdown Chart 
        {renderPieChart(
          "COMBINED FUEL END-USE BREAKDOWN - KBTU", 
          defaultCombinedEndUseData
        )}
        
        {/* End-Use Breakdown by KWH Chart 
        {renderPieChart(
          "END-USE BREAKDOWN INPUT BY KWH", 
          defaultElectricEndUseData
        )}
        
        {/* End-Use Breakdown by Therms Chart 
        {renderPieChart(
          "END-USE BREAKDOWN INPUT BY THERMS",
          defaultGasEndUseData
        )} */}
      </div>
      
      {/* Weather Effects on Energy Use Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground">
          4. Weather Effects on Energy Use
        </h3>
        
        <p className="text-sm leading-relaxed text-muted-foreground mb-3">
          A cooling degree day (CDD) is a measurement designed to quantify the demand for energy
          needed to cool buildings. It is the number of degrees that a day's average temperature is above
          65° Fahrenheit (18° Celsius). A similar measurement, heating degree day (HDD), reflects the
          amount of energy needed to heat a home or business.
        </p>
        
        <h4 className="text-lg font-semibold mb-3 ml-4 text-emerald-700 dark:text-emerald-500">
          a. Electric Usage and Degree Days
        </h4>
        
        <div className="ml-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The cooling degree days (CDD) are used in comparison to actual electric usage. As expected,
            an analysis of the kWh usage shows that building electric consumption follows the CDD trend.
          </p>
          
          <p className="text-sm leading-relaxed text-muted-foreground">
            The heating degree days (HDD) are used in comparison to actual gas consumption. This
            analysis does not apply to this building since space heating is provided by electric resistance.
          </p>
          
          <p className="mb-6 text-gray-700 dark:text-gray-300">
            In general, electric usage is affected by increases in CDDs. Typically, energy usage closely
            follows seasonal variations and changes from this pattern are likely due to buildings control
            systems and occupant behavior. The electric usage billing data has been normalized.
          </p>
          
          {/* Degree Days Chart */}
          <div className="border-2 border-gray-300 p-4 mb-4">
            <h4 className="text-center text-lg font-bold mb-4">Electric Usage and Degree Days</h4>
            
            {/* Render the real chart instead of a placeholder */}
            <DegreeDayChart 
              data={degreeDayData.length > 0 ? degreeDayData : defaultDegreeDayData} 
              height={320}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default EnergyUseAnalysis; 