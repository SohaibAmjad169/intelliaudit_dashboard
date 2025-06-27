import React, { useEffect, useState } from 'react';
import { useMonthlyUtilityData } from '@/hooks/data/useEnergyData';

// Constants for energy unit conversions
const KWH_TO_MMBTU = 0.003412;
const THERM_TO_MMBTU = 0.1;

interface MonthlyData {
  month: number;
  year: number;
  usage: number;
  cost: number;
}

interface ProcessedMonthlyData {
  month: string;
  hdd: number;
  cdd: number;
  kwh: number;
  totalCost: number;
  avgCostPerKwh: number;
  electricMMBtu: number;
  therms: number;
  gasCharges: number;
  costPerTherm: number;
  gasMMBtu: number;
}

interface EnergySummary {
  effectiveElectricPerKwh: number;
  effectiveElectricPerMMBtu: number;
  effectiveGasPerTherm: number;
  effectiveGasPerMMBtu: number;
  annualElectricUsage: number;
  annualElectricCost: number;
  annualGasUsage: number;
  annualGasCost: number;
  totalUtilityCost: number;
}

interface UtilityDataTableProps {
  projectId: string;
}

export const UtilityDataTable: React.FC<UtilityDataTableProps> = ({ projectId }) => {
  // Fetch monthly utility data
  const { data: electricData, isLoading: isLoadingElectric } = useMonthlyUtilityData(projectId, 'electric');
  const { data: gasData, isLoading: isLoadingGas } = useMonthlyUtilityData(projectId, 'natural-gas');
  
  const [processedData, setProcessedData] = useState<ProcessedMonthlyData[]>([]);
  const [energySummary, setEnergySummary] = useState<EnergySummary>({
    effectiveElectricPerKwh: 0,
    effectiveElectricPerMMBtu: 0,
    effectiveGasPerTherm: 0,
    effectiveGasPerMMBtu: 0,
    annualElectricUsage: 0,
    annualElectricCost: 0,
    annualGasUsage: 0,
    annualGasCost: 0,
    totalUtilityCost: 0
  });
  
  // Static weather data (HDD/CDD) for example
  const weatherData = [
    { month: 'January', hdd: 31, cdd: 0 },
    { month: 'February', hdd: 28, cdd: 0 },
    { month: 'March', hdd: 20, cdd: 0 },
    { month: 'April', hdd: 10, cdd: 2 },
    { month: 'May', hdd: 3, cdd: 8 },
    { month: 'June', hdd: 0, cdd: 15 },
    { month: 'July', hdd: 0, cdd: 25 },
    { month: 'August', hdd: 0, cdd: 23 },
    { month: 'September', hdd: 2, cdd: 10 },
    { month: 'October', hdd: 8, cdd: 2 },
    { month: 'November', hdd: 20, cdd: 0 },
    { month: 'December', hdd: 30, cdd: 0 }
  ];
  
  // Process the data when it's loaded
  useEffect(() => {
    if (isLoadingElectric || isLoadingGas) return;
    
    // Convert API data to a consistent format
    const processMonthlyData = (electricItems: MonthlyData[], gasItems: MonthlyData[]) => {
      const processedData: ProcessedMonthlyData[] = [];
      let totalElectricUsage = 0;
      let totalElectricCost = 0;
      let totalGasUsage = 0;
      let totalGasCost = 0;
      
      // Create array of months for current year
      const currentYear = new Date().getFullYear();
      const months = [
        { monthNum: 1, name: 'January' },
        { monthNum: 2, name: 'February' },
        { monthNum: 3, name: 'March' },
        { monthNum: 4, name: 'April' },
        { monthNum: 5, name: 'May' },
        { monthNum: 6, name: 'June' },
        { monthNum: 7, name: 'July' },
        { monthNum: 8, name: 'August' },
        { monthNum: 9, name: 'September' },
        { monthNum: 10, name: 'October' },
        { monthNum: 11, name: 'November' },
        { monthNum: 12, name: 'December' }
      ];
      
      // Process each month
      months.forEach(({ monthNum, name }) => {
        // Find electric data for this month (try current year first, then previous year)
        const electricItem = electricItems.find(item => 
          item.month === monthNum && item.year === currentYear
        ) || electricItems.find(item => 
          item.month === monthNum && item.year === currentYear - 1
        ) || { usage: 0, cost: 0 };
        
        // Find gas data for this month (try current year first, then previous year)
        const gasItem = gasItems.find(item => 
          item.month === monthNum && item.year === currentYear
        ) || gasItems.find(item => 
          item.month === monthNum && item.year === currentYear - 1
        ) || { usage: 0, cost: 0 };
        
        // Find weather data for this month
        const weatherItem = weatherData.find(item => item.month === name) || { hdd: 0, cdd: 0 };
        
        // Calculate derived values
        const kwh = Number(electricItem.usage) || 0;
        const electricCost = Number(electricItem.cost) || 0;
        const avgCostPerKwh = kwh > 0 ? electricCost / kwh : 0;
        const electricMMBtu = kwh * KWH_TO_MMBTU;
        
        const therms = Number(gasItem.usage) || 0;
        const gasCost = Number(gasItem.cost) || 0;
        const costPerTherm = therms > 0 ? gasCost / therms : 0;
        const gasMMBtu = therms * THERM_TO_MMBTU;
        
        processedData.push({
          month: name,
          hdd: weatherItem.hdd,
          cdd: weatherItem.cdd,
          kwh,
          totalCost: electricCost,
          avgCostPerKwh,
          electricMMBtu,
          therms,
          gasCharges: gasCost,
          costPerTherm,
          gasMMBtu
        });
        
        // Add to totals
        totalElectricUsage += kwh;
        totalElectricCost += electricCost;
        totalGasUsage += therms;
        totalGasCost += gasCost;
      });
      
      // Calculate energy summary
      const effectiveElectricPerKwh = totalElectricUsage > 0 ? totalElectricCost / totalElectricUsage : 0;
      const effectiveElectricPerMMBtu = totalElectricUsage > 0 ? 
        totalElectricCost / (totalElectricUsage * KWH_TO_MMBTU) : 0;
      
      const effectiveGasPerTherm = totalGasUsage > 0 ? totalGasCost / totalGasUsage : 0;
      const effectiveGasPerMMBtu = totalGasUsage > 0 ? 
        totalGasCost / (totalGasUsage * THERM_TO_MMBTU) : 0;
      
      setEnergySummary({
        effectiveElectricPerKwh,
        effectiveElectricPerMMBtu,
        effectiveGasPerTherm,
        effectiveGasPerMMBtu,
        annualElectricUsage: totalElectricUsage,
        annualElectricCost: totalElectricCost,
        annualGasUsage: totalGasUsage,
        annualGasCost: totalGasCost,
        totalUtilityCost: totalElectricCost + totalGasCost
      });
      
      return processedData;
    };
    
    // Process the data
    const processed = processMonthlyData(
      Array.isArray(electricData) ? electricData : [], 
      Array.isArray(gasData) ? gasData : []
    );
    
    setProcessedData(processed);
  }, [electricData, gasData, isLoadingElectric, isLoadingGas]);
  
  // Format numbers for display
  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };
  
  const formatCurrency = (num: number, decimals: number = 2) => {
    return '$' + num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };
  
  // Return a loading state if data is still being fetched
  if (isLoadingElectric || isLoadingGas) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Utilities Data Table</h2>
      
      {/* Main utility data table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th colSpan={3} className="px-4 py-2 text-center font-medium bg-gray-200 dark:bg-gray-600 border-r border-gray-300 dark:border-gray-500">
                WEATHER DATA<br />(65° F)
              </th>
              <th colSpan={4} className="px-4 py-2 text-center font-medium bg-gray-200 dark:bg-gray-600 border-r border-gray-300 dark:border-gray-500">
                ELECTRICITY USE DATA
              </th>
              <th colSpan={4} className="px-4 py-2 text-center font-medium bg-gray-200 dark:bg-gray-600">
                GAS USE DATA
              </th>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-800 text-center">
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Month</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">HDD</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-500">CDD</th>
              
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">kWh<br />Usage</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Total Cost</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Avg. Cost<br />/ kWh</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-500">Electric<br />MMBtu</th>
              
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Therms</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Total Gas<br />Charges</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Cost /<br />Therm</th>
              <th className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">Gas<br />MMBtu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {processedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.month}</td>
                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{row.hdd}</td>
                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-500">{row.cdd}</td>
                
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatNumber(row.kwh)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatCurrency(row.totalCost)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatCurrency(row.avgCostPerKwh)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-500">
                  {formatNumber(row.electricMMBtu)}
                </td>
                
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatNumber(row.therms)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatCurrency(row.gasCharges)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatCurrency(row.costPerTherm)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatNumber(row.gasMMBtu)}
                </td>
              </tr>
            ))}
            
            {/* Total row */}
            <tr className="bg-gray-100 dark:bg-gray-700 font-medium">
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">TOTAL</td>
              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-500">-</td>
              
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatNumber(energySummary.annualElectricUsage)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(energySummary.annualElectricCost)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(energySummary.effectiveElectricPerKwh)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-500">
                {formatNumber(energySummary.annualElectricUsage * KWH_TO_MMBTU)}
              </td>
              
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatNumber(energySummary.annualGasUsage)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(energySummary.annualGasCost)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(energySummary.effectiveGasPerTherm)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatNumber(energySummary.annualGasUsage * THERM_TO_MMBTU)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Energy Summary Table */}
      <h3 className="text-lg font-semibold mt-8 mb-4 text-gray-900 dark:text-white">Energy Summary Table</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Electrical $/kWh</span>
              <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(energySummary.effectiveElectricPerKwh)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Electrical $/MMBtu</span>
              <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(energySummary.effectiveElectricPerMMBtu)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Gas $/Therm</span>
              <span className="ml-2 text-xs px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(energySummary.effectiveGasPerTherm)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Effective Gas $/MMBtu</span>
              <span className="ml-2 text-xs px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(energySummary.effectiveGasPerMMBtu)}</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Electrical Usage</span>
              <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatNumber(energySummary.annualElectricUsage)} kWh</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Electrical Cost</span>
              <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(energySummary.annualElectricCost)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Gas Usage</span>
              <span className="ml-2 text-xs px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatNumber(energySummary.annualGasUsage)} therms</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Annual Gas Cost</span>
              <span className="ml-2 text-xs px-2 py-1 bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(energySummary.annualGasCost)}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border-t-2 border-gray-300 dark:border-gray-600">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Utility Cost</span>
              <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(energySummary.totalUtilityCost)}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Utility Bills Period: January through December
      </div>
    </div>
  );
}; 