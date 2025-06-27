import React from 'react';
import { DollarSign, Zap, Flame } from 'lucide-react';
import { ReportData } from './types';
import { formatCurrency, formatNumber, formatCostPerSqFt, formatEnergyUsagePerSqFt, formatWaterUsagePerSqFt } from './utilities';

interface EnergyUsageBreakdownProps {
  reportData: ReportData;
  squareFootage: number;
}

export const EnergyUsageBreakdown: React.FC<EnergyUsageBreakdownProps> = ({ reportData, squareFootage }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Energy Cost Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
          Energy Cost Breakdown
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-1">
              <Zap className="h-4 w-4 mr-1 text-yellow-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Electricity</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(reportData.totalCost.electric)}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">per year</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatCostPerSqFt(reportData.totalCost.electric, squareFootage)}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-1">
              <Flame className="h-4 w-4 mr-1 text-orange-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Natural Gas</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(reportData.totalCost.naturalGas)}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">per year</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatCostPerSqFt(reportData.totalCost.naturalGas, squareFootage)}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1 text-blue-500">
                <path d="M12 2v6m0 0a5 5 0 0 1 5 5m-5-5a5 5 0 0 0-5 5m5 14v-5m-7-4h2m10 0h2"></path>
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Water</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(reportData.totalCost.water)}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">per year</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatCostPerSqFt(reportData.totalCost.water, squareFootage)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy Usage Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <Zap className="h-5 w-5 mr-2 text-emerald-500" />
          Energy Usage Breakdown
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-1">
              <Zap className="h-4 w-4 mr-1 text-yellow-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Electricity</span>
            </div>
            <div className="text-xl font-bold">{formatNumber(reportData.totalUsage.electric)}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">kWh per year</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatEnergyUsagePerSqFt(reportData.totalUsage.electric, squareFootage)}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-1">
              <Flame className="h-4 w-4 mr-1 text-orange-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Natural Gas</span>
            </div>
            <div className="text-xl font-bold">{formatNumber(reportData.totalUsage.naturalGas)}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">kWh per year</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatEnergyUsagePerSqFt(reportData.totalUsage.naturalGas, squareFootage)}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1 text-blue-500">
                <path d="M12 2v6m0 0a5 5 0 0 1 5 5m-5-5a5 5 0 0 0-5 5m5 14v-5m-7-4h2m10 0h2"></path>
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Water</span>
            </div>
            <div className="text-xl font-bold">{formatNumber(
              // Calculate water usage total from monthly data
              reportData.monthlyData.water.reduce((sum, item) => sum + (Number(item.usage) || 0), 0)
            )}</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">gallons per year</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {formatWaterUsagePerSqFt(
                  reportData.monthlyData.water.reduce((sum, item) => sum + (Number(item.usage) || 0), 0),
                  squareFootage
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 