import React, { useEffect, useState } from 'react';
import { fetchMonthlyUtilityData, fetchTotalUtilityCost, fetchTotalUtilityUsage } from '@/services/energy-analysis';

interface WaterDataTableProps {
  projectId: string;
}

interface MonthlyWaterData {
  month: number;
  year: number;
  usage: number;
  cost: number;
}

interface WaterSummary {
  totalAnnualUsage: number;
  totalAnnualCost: number;
  averageCostPerHCF: number;
}

export const WaterDataTable: React.FC<WaterDataTableProps> = ({ projectId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyWaterData[]>([]);
  const [waterSummary, setWaterSummary] = useState<WaterSummary>({
    totalAnnualUsage: 0,
    totalAnnualCost: 0,
    averageCostPerHCF: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);

        // Fetch total water usage and cost data
        const [costData, usageData, rawMonthlyWaterData] = await Promise.all([
          fetchTotalUtilityCost(projectId),
          fetchTotalUtilityUsage(projectId),
          fetchMonthlyUtilityData(projectId, 'water')
        ]);

        // Filter out December 2023 data point as requested
        const monthlyWaterData = rawMonthlyWaterData.filter(item => !(item.month === 12 && item.year === 2023));
        console.log('Filtered out Dec 2023 from shareable water data table');

        // Calculate total annual values
        const totalAnnualUsage = usageData.waterUsage || 0;
        const totalAnnualCost = costData.waterCost || 0;
        const averageCostPerHCF = totalAnnualUsage > 0 ? totalAnnualCost / totalAnnualUsage : 0;

        setWaterSummary({
          totalAnnualUsage,
          totalAnnualCost,
          averageCostPerHCF
        });

        // Process and normalize monthly data
        const processedMonthlyData = processMonthlyData(monthlyWaterData);
        setMonthlyData(processedMonthlyData);
      } catch (error) {
        console.error('Error fetching water data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Process monthly data to ensure all months are represented
  const processMonthlyData = (data: any[]): MonthlyWaterData[] => {
    const currentYear = new Date().getFullYear();
    const result: MonthlyWaterData[] = [];

    // Ensure we have data for all 12 months
    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1;

      // Find data for this month, or use default values
      const monthData = Array.isArray(data)
        ? data.find(item => item.month === monthNum)
        : null;

      result.push({
        month: monthNum,
        year: monthData?.year || currentYear,
        usage: monthData?.usage || 0,
        cost: monthData?.cost || 0
      });
    }

    return result;
  };

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
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get month name from month number
  const getMonthName = (month: number) => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Water Usage Data</h2>

      {/* Main water data table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th colSpan={3} className="px-4 py-2 text-center font-medium bg-blue-100 dark:bg-blue-900/40 border-r border-gray-300 dark:border-gray-500">
                WATER USAGE AND COST
              </th>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-800 text-center">
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Month</th>
              <th className="px-3 py-2 font-medium text-right text-gray-700 dark:text-gray-300">Usage (HCF)</th>
              <th className="px-3 py-2 font-medium text-right text-gray-700 dark:text-gray-300">Cost ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {monthlyData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{getMonthName(row.month)}</td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatNumber(row.usage)}
                </td>
                <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                  {formatCurrency(row.cost)}
                </td>
              </tr>
            ))}

            {/* Total row */}
            <tr className="bg-gray-100 dark:bg-gray-700 font-medium">
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">TOTAL</td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatNumber(waterSummary.totalAnnualUsage)}
              </td>
              <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                {formatCurrency(waterSummary.totalAnnualCost)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Water Summary Section */}
      <h3 className="text-lg font-semibold mt-8 mb-4 text-gray-900 dark:text-white">Water Usage Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Annual Water Usage</span>
            <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
          </div>
          <span className="font-medium text-gray-800 dark:text-white">{formatNumber(waterSummary.totalAnnualUsage)} HCF</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Annual Water Cost</span>
            <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
          </div>
          <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(waterSummary.totalAnnualCost)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Cost per HCF</span>
            <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded">Real Data</span>
          </div>
          <span className="font-medium text-gray-800 dark:text-white">{formatCurrency(waterSummary.averageCostPerHCF, 2)}/HCF</span>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Water utility data based on actual billing information. 1 HCF (Hundred Cubic Feet) = 748 gallons.
      </div>
    </div>
  );
};