import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/services/common/axios-config';
import { Chart, registerables, ChartOptions } from 'chart.js';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Box } from '@/components/ui/box';
import { BarChart, LineChart, Activity, DollarSign, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { safelyAccessArray, safelyAccessProperty } from '@/utils/response-helpers';

// Register Chart.js components
Chart.register(...registerables);

interface WeatherEnergyCorrelationProps {
  projectId: string;
  className?: string;
  showDetailedReport?: boolean;
  hideChart?: boolean;
}

// Month names for the x-axis
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Add conversion constants
const THERM_TO_MMBTU = 0.1; // 1 therm = 0.1 MMBtu
const KWH_TO_MMBTU = 0.003412; // 1 kWh = 0.003412 MMBtu

export const WeatherEnergyCorrelationChart: React.FC<WeatherEnergyCorrelationProps> = ({
  projectId,
  className = '',
  showDetailedReport = false,
  hideChart = false,
}) => {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [electricData, setElectricData] = useState<any[]>([]);
  const [naturalGasData, setNaturalGasData] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCost, setShowCost] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');
  const [showDetailedReportState, setShowDetailedReportState] = useState(showDetailedReport);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Get the current project details
  const zipCode = weatherData[0]?.zip_code || 'Unknown';
  const baseYear = weatherData[0]?.monthly_data?.[0]?.base_year || 
                 (electricData.length > 0 ? electricData[0].year : 
                 (naturalGasData.length > 0 ? naturalGasData[0].year : 
                 new Date().getFullYear()));

  // Fetch data when component mounts
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [weatherResponse, electricResponse, gasResponse, projectResponse] = await Promise.all([
          axiosInstance.get(`/api/weather/project?projectId=${projectId}`),
          axiosInstance.get(`/api/utility-calcs/projects/${projectId}/monthly/electric`),
          axiosInstance.get(`/api/utility-calcs/projects/${projectId}/monthly/natural-gas`),
          axiosInstance.get(`/api/projects/${projectId}`)
        ]);

        // Handle weather data
        const weatherDataArray = safelyAccessArray<any>(safelyAccessProperty(weatherResponse, 'data', []));
        if (weatherDataArray.length > 0) {
          setWeatherData(weatherDataArray);
          console.log('Weather data loaded:', weatherDataArray);
        } else {
          console.warn('No weather data available for project:', projectId);
          setWeatherData([]);
        }

        // Handle electric data
        const electricDataArray = safelyAccessArray<any>(safelyAccessProperty(electricResponse, 'data', []));
        if (electricDataArray.length > 0) {
          console.log('Raw electric data structure:', electricDataArray.slice(0, 2));
          
          // Check if data has the expected format
          const hasMonthField = electricDataArray.length > 0 && 'month' in electricDataArray[0];
          console.log('Electric data has month field:', hasMonthField);
          
          // Process data before setting state
          let processedElectricData = electricDataArray;
          
          // If data doesn't have month field but has year field, it might be using start_date
          if (!hasMonthField && electricDataArray.length > 0 && 'start_date' in electricDataArray[0]) {
            console.log('Electric data using start_date instead of month');
            processedElectricData = electricDataArray.map((item: any) => {
              // Extract month from start_date (format: YYYY-MM-DD)
              const startDate = item.start_date;
              const month = startDate ? new Date(startDate).getMonth() + 1 : 0;
              return {
                ...item,
                month: month
              };
            });
          }
          
          // Set the processed data
          setElectricData(processedElectricData);
          console.log('Processed electric data:', processedElectricData.slice(0, 2));
        } else {
          console.warn('No electric data available for project:', projectId);
          setElectricData([]);
        }

        // Handle gas data
        const gasDataArray = safelyAccessArray<any>(safelyAccessProperty(gasResponse, 'data', []));
        if (gasDataArray.length > 0) {
          console.log('Raw gas data structure:', gasDataArray.slice(0, 2));
          
          // Check if data has the expected format
          const hasMonthField = gasDataArray.length > 0 && 'month' in gasDataArray[0];
          console.log('Gas data has month field:', hasMonthField);
          
          // Process data before setting state
          let processedGasData = gasDataArray;
          
          // If data doesn't have month field but has start_date field
          if (!hasMonthField && gasDataArray.length > 0 && 'start_date' in gasDataArray[0]) {
            console.log('Gas data using start_date instead of month');
            processedGasData = gasDataArray.map((item: any) => {
              // Extract month from start_date (format: YYYY-MM-DD)
              const startDate = item.start_date;
              const month = startDate ? new Date(startDate).getMonth() + 1 : 0;
              return {
                ...item,
                month: month
              };
            });
          }
          
          // Set the processed data
          setNaturalGasData(processedGasData);
          console.log('Processed gas data:', processedGasData.slice(0, 2));
        } else {
          console.warn('No natural gas data available for project:', projectId);
          setNaturalGasData([]);
        }

        // Handle project data
        const projectDataObj = safelyAccessProperty(projectResponse, 'data', null);
        if (projectDataObj) {
          setProjectData(projectDataObj);
          console.log('Project data loaded:', projectDataObj);
        } else {
          console.warn('No project data available for project ID:', projectId);
          setProjectData(null);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setWeatherData([]);
        setElectricData([]);
        setNaturalGasData([]);
        setProjectData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Prepare and render chart
  useEffect(() => {
    if (!chartRef.current || isLoading) return;
    
    if (!weatherData.length && !electricData.length && !naturalGasData.length) {
      return;
    }
    
    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Process weather data
    const weatherByMonth: Record<number, { hdd: number; cdd: number }> = {};
    
    if (weatherData.length > 0 && weatherData[0]?.monthly_data) {
      // Get monthly weather data
      const monthlyData = [...weatherData[0].monthly_data]
        .filter((item: any) => item.month >= 1 && item.month <= 12)
        .sort((a: any, b: any) => a.month - b.month);
      
      // Create map for easy lookup
      monthlyData.forEach((item: any) => {
        weatherByMonth[item.month] = {
          hdd: item.base_year_hdd || 0,
          cdd: item.base_year_cdd || 0
        };
      });
    }
    
    // Process electric data
    const electricByMonth: Record<number, { usage: number; cost: number }> = {};
    
    // More flexible matching for electric data
    for (let month = 1; month <= 12; month++) {
      // First try direct month property match
      let monthData = electricData.find((d: any) => d.month === month);
      
      // If not found, try matching by start_date
      if (!monthData && electricData.length > 0 && 'start_date' in electricData[0]) {
        monthData = electricData.find((d: any) => {
          if (!d.start_date) return false;
          const dataMonth = new Date(d.start_date).getMonth() + 1;
          return dataMonth === month;
        });
      }
      
      // Use the found data or default to zeros
      electricByMonth[month] = {
        usage: monthData?.usage || 0,
        cost: monthData?.cost || 0
      };
    }
    
    // Process natural gas data
    const gasByMonth: Record<number, { usage: number; cost: number }> = {};
    
    // More flexible matching for gas data
    for (let month = 1; month <= 12; month++) {
      // First try direct month property match
      let monthData = naturalGasData.find((d: any) => d.month === month);
      
      // If not found, try matching by start_date
      if (!monthData && naturalGasData.length > 0 && 'start_date' in naturalGasData[0]) {
        monthData = naturalGasData.find((d: any) => {
          if (!d.start_date) return false;
          const dataMonth = new Date(d.start_date).getMonth() + 1;
          return dataMonth === month;
        });
      }
      
      // Use the found data or default to zeros
      gasByMonth[month] = {
        usage: monthData?.usage || 0,
        cost: monthData?.cost || 0
      };
    }
    
    // Create combined dataset for all 12 months
    const labels = [];
    const hddValues = [];
    const cddValues = [];
    const electricValues = [];
    const gasValues = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthName = MONTH_NAMES[month - 1];
      labels.push(monthName);
      
      // Get HDD value
      const hddValue = weatherByMonth[month] ? weatherByMonth[month].hdd : 0;
      hddValues.push(hddValue);
      
      // Get CDD value
      const cddValue = weatherByMonth[month] ? weatherByMonth[month].cdd : 0;
      cddValues.push(cddValue);
      
      // Get electric value
      const electricValue = electricByMonth[month] 
        ? (showCost ? electricByMonth[month].cost : electricByMonth[month].usage) 
        : 0;
      electricValues.push(electricValue);
      
      // Get gas value
      const gasValue = gasByMonth[month] 
        ? (showCost ? gasByMonth[month].cost : gasByMonth[month].usage) 
        : 0;
      gasValues.push(gasValue);
    }

    // Create chart
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Determine y-axis properties
    const weatherLabel = 'Degree Days';
    const electricLabel = showCost ? 'Electric Cost' : 'Electric Usage';
    const gasLabel = showCost ? 'Natural Gas Cost' : 'Natural Gas Usage';
    
    // Normalize scale for gas usage if not showing cost
    // This is to make the comparison visually meaningful
    const gasMultiplier = !showCost && gasValues.length > 0 && electricValues.length > 0 ? (electricValues[0] / gasValues[0]) : 1;
    const scaledGasValues = gasValues.map(v => v * gasMultiplier);
    
    // Set options for chart
    const options: ChartOptions<'line' | 'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: weatherLabel,
            color: '#3b82f6'
          },
          ticks: {
            color: '#3b82f6'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          min: 0
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: showCost ? 'Cost ($)' : 'Usage',
            color: '#10b981'
          },
          ticks: {
            color: '#10b981'
          },
          grid: {
            drawOnChartArea: false
          },
          min: 0
        },
        x: {
          title: {
            display: true,
            text: 'Month',
            color: '#ebebeb'
          },
          ticks: {
            color: '#ebebeb'
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
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw as number;
              const datasetLabel = context.dataset.label || '';
              
              if (datasetLabel.includes('HDD') || datasetLabel.includes('CDD')) {
                return `${value.toLocaleString()} Degree Days`;
              } else if (datasetLabel.includes('Electric')) {
                if (showCost) {
                  return `$${value.toLocaleString()}`;
                } else {
                  return `${value.toLocaleString()} kWh`;
                }
              } else if (datasetLabel.includes('Natural Gas')) {
                if (showCost) {
                  return `$${value.toLocaleString()}`;
                } else {
                  // Display the actual value, not the scaled one
                  const actualValue = value / gasMultiplier;
                  return `${actualValue.toLocaleString()} therms`;
                }
              }
              return `${value}`;
            }
          }
        }
      }
    };

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
            borderWidth: 2,
            yAxisID: 'y',
            order: 1
          },
          {
            label: 'Cooling Degree Days (CDD)',
            data: cddValues,
            backgroundColor: 'rgba(14, 165, 233, 0.5)', // Light blue - sky-500
            borderColor: 'rgb(14, 165, 233)',           // Light blue - sky-500
            borderWidth: 2,
            yAxisID: 'y',
            order: 2
          },
          {
            label: electricLabel,
            data: electricValues,
            backgroundColor: 'rgba(16, 185, 129, 0.5)', // Green - emerald-500
            borderColor: 'rgb(16, 185, 129)',           // Green - emerald-500
            borderWidth: 2,
            yAxisID: 'y1',
            order: 3
          },
          {
            label: gasLabel,
            data: showCost ? gasValues : scaledGasValues, // Use scaled values for usage
            backgroundColor: 'rgba(249, 115, 22, 0.5)',    // Orange - orange-500
            borderColor: 'rgb(249, 115, 22)',              // Orange - orange-500
            borderWidth: 2,
            yAxisID: 'y1',
            order: 4
          }
        ]
      },
      options: options
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [weatherData, electricData, naturalGasData, isLoading, showCost, chartType]);

  // Format report data as text for clipboard
  const formatReportForClipboard = () => {
    // Get project name and address from project data if available
    const projectName = projectData?.name || `${zipCode} Building`;
    const projectAddress = projectData?.building_address || zipCode;
    // Building area - use real data if available, otherwise fallback to placeholder
    const buildingArea = projectData?.property_gross_floor_area || 20000;
    const buildingType = projectData?.property_primary_function || 'Unknown';
    const buildingYearBuilt = projectData?.property_year_built || 'Unknown';

    let report = `ASHRAE LEVEL II ENERGY AUDIT REPORT\n`;
    report += `================================================\n\n`;
    report += `Project Name: ${projectName}\n`;
    report += `Full Address: ${projectAddress}\n`;
    report += `Building Type: ${buildingType}\n`;
    report += `Year Built: ${buildingYearBuilt}\n`;
    report += `Gross Floor Area: ${buildingArea.toLocaleString()} ft²\n\n`;

    // Utilities Data Table
    report += `UTILITIES DATA TABLE\n`;
    report += `=================\n\n`;
    
    // Add a note about data sources
    if (!projectData?.property_gross_floor_area) {
      report += `NOTE: All usage and cost data is from the database. Building area (20,000 ft²) is a placeholder value.\n\n`;
    }
    
    // Headers
    report += `Month\tYear\tHDD\tCDD\tkWh Usage\tElectric Cost\tCost/kWh\tElectric MMBtu\t`;
    report += `Therms\tGas Cost\tCost/Therm\tGas MMBtu\n`;
    
    // Monthly data
    for (let month = 1; month <= 12; month++) {
      const monthName = MONTH_NAMES[month - 1];
      const weather = weatherData[0]?.monthly_data?.find((d: any) => d.month === month) || {};
      
      // More flexible matching for electric and gas data
      // First try to match by month field
      let electric = electricData.find((d: any) => d.month === month);
      
      // If no match, try by start_date
      if (!electric && electricData.length > 0 && 'start_date' in electricData[0]) {
        electric = electricData.find((d: any) => {
          if (!d.start_date) return false;
          const dataMonth = new Date(d.start_date).getMonth() + 1;
          return dataMonth === month;
        });
      }
      
      // Default to empty object with zeros if no match found
      electric = electric || { usage: 0, cost: 0 };
      
      // Same flexible matching for gas data
      let gas = naturalGasData.find((d: any) => d.month === month);
      
      // If no match, try by start_date
      if (!gas && naturalGasData.length > 0 && 'start_date' in naturalGasData[0]) {
        gas = naturalGasData.find((d: any) => {
          if (!d.start_date) return false;
          const dataMonth = new Date(d.start_date).getMonth() + 1;
          return dataMonth === month;
        });
      }
      
      // Default to empty object with zeros if no match found
      gas = gas || { usage: 0, cost: 0 };
      
      // Calculate derived values
      const electricMMBtu = electric.usage * KWH_TO_MMBTU;
      const gasMMBtu = gas.usage * THERM_TO_MMBTU;
      const costPerKWh = electric.usage > 0 ? electric.cost / electric.usage : 0;
      const costPerTherm = gas.usage > 0 ? gas.cost / gas.usage : 0;
      
      report += `${monthName}\t${baseYear}\t`;
      report += `${Math.round(weather.base_year_hdd || 0)}\t`;
      report += `${Math.round(weather.base_year_cdd || 0)}\t`;
      report += `${Math.round(electric.usage)}\t`;
      report += `$${electric.cost.toFixed(2)}\t`;
      report += `$${costPerKWh.toFixed(2)}\t`;
      report += `${Math.round(electricMMBtu)}\t`;
      report += `${Math.round(gas.usage)}\t`;
      report += `$${gas.cost.toFixed(2)}\t`;
      report += `$${costPerTherm.toFixed(2)}\t`;
      report += `${Math.round(gasMMBtu)}\n`;
    }
    
    // Calculate totals
    const totalElectricUsage = electricData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
    const totalElectricCost = electricData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
    const avgCostPerKWh = totalElectricUsage > 0 ? totalElectricCost / totalElectricUsage : 0;
    const totalElectricMMBtu = totalElectricUsage * KWH_TO_MMBTU;
    
    const totalGasUsage = naturalGasData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
    const totalGasCost = naturalGasData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
    const avgCostPerTherm = totalGasUsage > 0 ? totalGasCost / totalGasUsage : 0;
    const totalGasMMBtu = totalGasUsage * THERM_TO_MMBTU;
    
    const totalHDD = weatherData[0]?.monthly_data?.reduce((sum: number, item: any) => sum + (item.base_year_hdd || 0), 0) || 0;
    const totalCDD = weatherData[0]?.monthly_data?.reduce((sum: number, item: any) => sum + (item.base_year_cdd || 0), 0) || 0;

    // Add total row
    report += `TOTAL\t${baseYear}\t`;
    report += `${Math.round(totalHDD)}\t`;
    report += `${Math.round(totalCDD)}\t`;
    report += `${Math.round(totalElectricUsage)}\t`;
    report += `$${totalElectricCost.toFixed(2)}\t`;
    report += `$${avgCostPerKWh.toFixed(2)}\t`;
    report += `${Math.round(totalElectricMMBtu)}\t`;
    report += `${Math.round(totalGasUsage)}\t`;
    report += `$${totalGasCost.toFixed(2)}\t`;
    report += `$${avgCostPerTherm.toFixed(2)}\t`;
    report += `${Math.round(totalGasMMBtu)}\n\n`;
    
    // Energy Summary Table
    report += `ENERGY SUMMARY TABLE\n`;
    report += `=================\n\n`;
    report += `Effective Electrical $/kWh: $${avgCostPerKWh.toFixed(2)}\n`;
    report += `Effective Electrical $/MMBtu: $${(avgCostPerKWh / KWH_TO_MMBTU).toFixed(2)}\n`;
    report += `Effective Gas $/Therm: $${avgCostPerTherm.toFixed(2)}\n`;
    report += `Effective Gas $/MMBtu: $${(avgCostPerTherm / THERM_TO_MMBTU).toFixed(2)}\n\n`;
    
    // Building metrics
    const eui = (totalElectricMMBtu + totalGasMMBtu) / buildingArea;
    const eci = (totalElectricCost + totalGasCost) / buildingArea;
    
    report += `Gross Floor Area: ${buildingArea.toLocaleString()} ft²\n`;
    report += `Building Type: ${buildingType}\n`;
    report += `Year Built: ${buildingYearBuilt}\n`;
    report += `EUI (kBtu/ft²): ${(eui * 1000).toFixed(2)}\n`;
    report += `ECI ($/ft²): $${eci.toFixed(2)}\n`;
    report += `Total Utility Cost: $${(totalElectricCost + totalGasCost).toFixed(2)}\n\n`;
    
    report += `Utility Bills Period: January ${baseYear} through December ${baseYear}\n\n`;
    
    report += `Report generated: ${new Date().toLocaleString()}\n`;
    
    return report;
  };
  
  // Add a function to copy text to clipboard
  const copyReportToClipboard = async () => {
    const reportText = formatReportForClipboard();
    
    try {
      await navigator.clipboard.writeText(reportText);
      toast({
        title: "Report copied to clipboard",
        description: "You can now paste it into any document or spreadsheet",
        duration: 3000
      });
    } catch (err) {
      console.error('Failed to copy report to clipboard', err);
      toast({
        title: "Failed to copy to clipboard",
        description: "Please try again or manually select and copy the report",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  if (isLoading) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-muted-foreground">Loading weather and energy data...</p>
        </div>
      </Box>
    );
  }

  // Check if any data is available
  if (!weatherData.length && !electricData.length && !naturalGasData.length) {
    return (
      <Box intensity="subtle" className="flex items-center justify-center h-[400px] w-full bg-card">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            Weather and energy data are not available for this project.
          </p>
        </div>
      </Box>
    );
  }

  return (
    <Box intensity="subtle" className={`p-4 md:p-6 bg-card ${className}`}>
      {!hideChart && (
        <div className="flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
            <div>
              <h3 className="text-xl font-semibold">Weather-Energy Correlation ({baseYear})</h3>
              <p className="text-sm text-muted-foreground">
                ZIP Code: {zipCode} • Showing all data series together
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Energy metric tabs */}
              <Tabs value={showCost ? 'cost' : 'usage'} className="w-auto">
                <TabsList>
                  <TabsTrigger 
                    value="usage" 
                    onClick={() => setShowCost(false)}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Usage
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cost" 
                    onClick={() => setShowCost(true)}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Cost
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="w-full h-[400px] relative">
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
          
          <div className="text-sm text-muted-foreground mt-4 text-center border-t pt-4">
            <div className="w-full flex justify-between items-center">
              <span>Data for ASHRAE Level II Energy Audit requirements</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-xs">HDD</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-sky-500 mr-2"></div>
              <span className="text-xs">CDD</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
              <span className="text-xs">Electric {showCost ? 'Cost' : 'Usage'}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
              <span className="text-xs">Natural Gas {showCost ? 'Cost' : 'Usage'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Report Modal */}
      <Dialog open={showDetailedReportState} onOpenChange={setShowDetailedReportState}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>ASHRAE Level II Energy Audit Report</DialogTitle>
            <DialogDescription>
              Detailed energy and weather data for {zipCode}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Utilities Data Table</h3>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/80 border-b">
                    <th colSpan={3} className="text-center px-3 py-2 border-r">
                      WEATHER DATA<br/>(65° F)
                    </th>
                    <th colSpan={4} className="text-center px-3 py-2 border-r">ELECTRICITY USE DATA</th>
                    <th colSpan={4} className="text-center px-3 py-2">GAS USE DATA</th>
                  </tr>
                  <tr className="bg-muted">
                    <th className="px-3 py-2 text-left border-r">Month</th>
                    <th className="px-3 py-2 text-center">HDD</th>
                    <th className="px-3 py-2 text-center border-r">CDD</th>
                    
                    <th className="px-3 py-2 text-center">kWh Usage</th>
                    <th className="px-3 py-2 text-center">Total Cost</th>
                    <th className="px-3 py-2 text-center">Avg. Cost / kWh</th>
                    <th className="px-3 py-2 text-center border-r">Electric MMBtu</th>
                    
                    <th className="px-3 py-2 text-center">Therms</th>
                    <th className="px-3 py-2 text-center">Total Gas Charges</th>
                    <th className="px-3 py-2 text-center">Cost / Therm</th>
                    <th className="px-3 py-2 text-center">Gas MMBtu</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({length: 12}, (_, i) => i + 1).map((month) => {
                    const monthName = MONTH_NAMES[month - 1];
                    const weather = weatherData[0]?.monthly_data?.find((d: any) => d.month === month) || {};
                    
                    // More flexible matching for electric and gas data
                    // First try to match by month field
                    let electric = electricData.find((d: any) => d.month === month);
                    
                    // If no match, try by start_date
                    if (!electric && electricData.length > 0 && 'start_date' in electricData[0]) {
                      electric = electricData.find((d: any) => {
                        if (!d.start_date) return false;
                        const dataMonth = new Date(d.start_date).getMonth() + 1;
                        return dataMonth === month;
                      });
                    }
                    
                    // Default to empty object with zeros if no match found
                    electric = electric || { usage: 0, cost: 0 };
                    
                    // Same flexible matching for gas data
                    let gas = naturalGasData.find((d: any) => d.month === month);
                    
                    // If no match, try by start_date
                    if (!gas && naturalGasData.length > 0 && 'start_date' in naturalGasData[0]) {
                      gas = naturalGasData.find((d: any) => {
                        if (!d.start_date) return false;
                        const dataMonth = new Date(d.start_date).getMonth() + 1;
                        return dataMonth === month;
                      });
                    }
                    
                    // Default to empty object with zeros if no match found
                    gas = gas || { usage: 0, cost: 0 };
                    
                    // Calculate derived values
                    const electricMMBtu = electric.usage * KWH_TO_MMBTU;
                    const gasMMBtu = gas.usage * THERM_TO_MMBTU;
                    const costPerKWh = electric.usage > 0 ? electric.cost / electric.usage : 0;
                    const costPerTherm = gas.usage > 0 ? gas.cost / gas.usage : 0;
                    
                    return (
                      <tr key={month} className="border-t border-border hover:bg-muted/30">
                        <td className="px-3 py-1.5 font-medium border-r">{monthName}</td>
                        <td className="px-3 py-1.5 text-center">{(weather.base_year_hdd || 0).toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-center border-r">{(weather.base_year_cdd || 0).toLocaleString()}</td>
                        
                        <td className="px-3 py-1.5 text-right">{Math.round(electric.usage).toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right text-foreground">${electric.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-3 py-1.5 text-right text-foreground">${costPerKWh.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right border-r">{Math.round(electricMMBtu).toLocaleString()}</td>
                        
                        <td className="px-3 py-1.5 text-right">{Math.round(gas.usage).toLocaleString()}</td>
                        <td className="px-3 py-1.5 text-right text-foreground">${gas.cost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-3 py-1.5 text-right text-foreground">${costPerTherm.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right">{Math.round(gasMMBtu).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Totals row */}
                  <tr className="bg-muted/50 font-medium border-t border-t-gray-400">
                    <td className="px-3 py-2 border-r">TOTAL</td>
                    <td className="px-3 py-2 text-center">
                      {weatherData[0]?.monthly_data?.reduce((sum: number, item: any) => sum + (item.base_year_hdd || 0), 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center border-r">
                      {weatherData[0]?.monthly_data?.reduce((sum: number, item: any) => sum + (item.base_year_cdd || 0), 0).toLocaleString()}
                    </td>
                    
                    {(() => {
                      const totalElectricUsage = electricData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
                      const totalElectricCost = electricData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
                      const avgCostPerKWh = totalElectricUsage > 0 ? totalElectricCost / totalElectricUsage : 0;
                      
                      return (
                        <>
                          <td className="px-3 py-2 text-right">{Math.round(totalElectricUsage).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-foreground">${totalElectricCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-3 py-2 text-right text-foreground">${avgCostPerKWh.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right border-r">{Math.round(totalElectricUsage * KWH_TO_MMBTU).toLocaleString()}</td>
                        </>
                      );
                    })()}
                    
                    {(() => {
                      const totalGasUsage = naturalGasData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
                      const totalGasCost = naturalGasData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
                      const avgCostPerTherm = totalGasUsage > 0 ? totalGasCost / totalGasUsage : 0;
                      
                      return (
                        <>
                          <td className="px-3 py-2 text-right">{Math.round(totalGasUsage).toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-foreground">${totalGasCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          <td className="px-3 py-2 text-right text-foreground">${avgCostPerTherm.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">{Math.round(totalGasUsage * THERM_TO_MMBTU).toLocaleString()}</td>
                        </>
                      );
                    })()}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Energy Summary Table</h3>
            {!projectData?.property_gross_floor_area ? (
              <p className="text-xs text-muted-foreground mb-3">
                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mr-2">Note</span> 
                Building area (20,000 ft²) is a placeholder value as actual square footage could not be retrieved. All usage and cost data is real.
              </p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {(() => {
                      const totalElectricUsage = electricData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
                      const totalElectricCost = electricData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
                      const avgCostPerKWh = totalElectricUsage > 0 ? totalElectricCost / totalElectricUsage : 0;
                      
                      const totalGasUsage = naturalGasData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
                      const totalGasCost = naturalGasData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0);
                      const avgCostPerTherm = totalGasUsage > 0 ? totalGasCost / totalGasUsage : 0;
                      
                      return (
                        <>
                          <tr className="bg-blue-500/10">
                            <td className="px-3 py-2">Effective Electrical $/kWh <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Real Data</span></td>
                            <td className="px-3 py-2 text-right font-medium">${avgCostPerKWh.toFixed(2)}</td>
                          </tr>
                          <tr className="bg-blue-500/10">
                            <td className="px-3 py-2">Effective Electrical $/MMBtu <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Real Data</span></td>
                            <td className="px-3 py-2 text-right font-medium">${(avgCostPerKWh / KWH_TO_MMBTU).toFixed(2)}</td>
                          </tr>
                          <tr className="bg-orange-500/10">
                            <td className="px-3 py-2">Effective Gas $/Therm <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">Real Data</span></td>
                            <td className="px-3 py-2 text-right font-medium">${avgCostPerTherm.toFixed(2)}</td>
                          </tr>
                          <tr className="bg-orange-500/10">
                            <td className="px-3 py-2">Effective Gas $/MMBtu <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500">Real Data</span></td>
                            <td className="px-3 py-2 text-right font-medium">${(avgCostPerTherm / THERM_TO_MMBTU).toFixed(2)}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {(() => {
                      const totalElectricUsage = electricData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
                      const totalElectricMMBtu = totalElectricUsage * KWH_TO_MMBTU;
                      
                      const totalGasUsage = naturalGasData.reduce((sum: number, item: any) => sum + (item.usage || 0), 0);
                      const totalGasMMBtu = totalGasUsage * THERM_TO_MMBTU;
                      
                      // Building area - use real data if available, otherwise fallback to placeholder
                      const buildingArea = projectData?.property_gross_floor_area || 20000;
                      const eui = (totalElectricMMBtu + totalGasMMBtu) / buildingArea;
                      
                      return (
                        <>
                          <tr className="bg-emerald-500/10">
                            <td className="px-3 py-2">
                              Gross Conditioned Area 
                              {projectData?.property_gross_floor_area ? 
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Real Data</span> : 
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">Placeholder</span>}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">{buildingArea.toLocaleString()} ft²</td>
                          </tr>
                          <tr className="bg-emerald-500/10">
                            <td className="px-3 py-2">EUI (kBtu/ft²) <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Calculated</span></td>
                            <td className="px-3 py-2 text-right font-medium">{(eui * 1000).toFixed(2)}</td>
                          </tr>
                          <tr className="bg-red-500/10">
                            <td className="px-3 py-2">ECI ($/ft²) <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Calculated</span></td>
                            <td className="px-3 py-2 text-right font-medium">
                              ${((electricData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0) + 
                                  naturalGasData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0)) / 
                                  buildingArea).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <td className="px-3 py-2">Total Utility Cost <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Real Data</span></td>
                            <td className="px-3 py-2 text-right font-medium text-foreground">
                              ${(electricData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0) + 
                                 naturalGasData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2 bg-muted rounded text-sm text-center text-muted-foreground">
            Utility Bills Period: January {baseYear} through December {baseYear}
          </div>

          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowDetailedReportState(false)}
            >
              Close
            </Button>
            <Button 
              onClick={copyReportToClipboard}
              className="gap-1"
            >
              <FileText className="h-4 w-4" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}; 