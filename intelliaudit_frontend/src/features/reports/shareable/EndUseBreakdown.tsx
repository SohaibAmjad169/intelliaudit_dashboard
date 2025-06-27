import React from 'react';
import { FileText, BarChart3 } from 'lucide-react';
import { ReportData, EndUseBreakdownData } from './types';
import { EndUseBreakdownChart } from '@/features/energy/EndUseBreakdownChart';
import { EndUseBreakdown as EndUseBreakdownType } from '@/services/energy-analysis/types';

interface EndUseBreakdownProps {
  reportData: ReportData;
}

// Transform EndUseBreakdownData to EndUseBreakdown format
const transformToEndUseBreakdown = (data: EndUseBreakdownData): EndUseBreakdownType => {
  const breakdown = data.breakdown || [];
  const standardBreakdown = data.standardBreakdown || [];
  
  // Calculate individual end uses from breakdown
  const heating = breakdown.find(item => item.category.toLowerCase().includes('heating'))?.percentage || 0;
  const cooling = breakdown.find(item => item.category.toLowerCase().includes('cooling'))?.percentage || 0;
  const ventilation = breakdown.find(item => item.category.toLowerCase().includes('ventilation'))?.percentage || 0;
  const lighting = breakdown.find(item => item.category.toLowerCase().includes('lighting'))?.percentage || 0;
  const equipment = breakdown.find(item => item.category.toLowerCase().includes('equipment'))?.percentage || 0;
  const other = breakdown.find(item => item.category.toLowerCase().includes('other'))?.percentage || 0;

  return {
    heating,
    cooling,
    ventilation,
    lighting,
    equipment,
    other,
    breakdown: breakdown.map(item => ({
      category: item.category,
      annualKwh: 0, // These values are not available in the current data
      annualCost: 0,
      percentage: item.percentage
    })),
    modeledBreakdown: breakdown.map(item => ({
      category: item.category,
      annualKwh: 0,
      annualCost: 0,
      percentage: item.percentage,
      isModeled: true
    })),
    standardBreakdown,
    comparisonData: data.comparisonData,
    totalAnnualKwh: 0, // These values are not available in the current data
    totalModeledAnnualKwh: 0,
    buildingType: 'Unknown',
    recommendations: []
  };
};

export const EndUseBreakdown: React.FC<EndUseBreakdownProps> = ({ reportData }) => {
  if (!reportData.endUseBreakdown) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-base font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-emerald-500" />
          Energy End Use Breakdown
        </h2>
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No end use breakdown data available for this project.
        </div>
      </div>
    );
  }

  const endUseBreakdownData = reportData.endUseBreakdown as EndUseBreakdownData;
  const transformedData = transformToEndUseBreakdown(endUseBreakdownData);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-base font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
        <BarChart3 className="h-5 w-5 mr-2 text-emerald-500" />
        Energy End Use Breakdown
      </h2>
      
      {/* Side-by-side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Standard Benchmark Chart */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3 text-center text-gray-900 dark:text-white">Standard Benchmark</h3>
          <div className="h-80">
            {endUseBreakdownData.standardBreakdown && endUseBreakdownData.standardBreakdown.length > 0 ? (
              <div className="flex items-center justify-center">
                <EndUseBreakdownChart 
                  data={transformedData}
                  height={300}
                  width={300}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500 dark:text-gray-400">Standard benchmark data not available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Current Building Chart */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3 text-center text-gray-900 dark:text-white">This Building</h3>
          <div className="h-80">
            {endUseBreakdownData.breakdown && endUseBreakdownData.breakdown.length > 0 ? (
              <div className="flex items-center justify-center">
                <EndUseBreakdownChart 
                  data={transformedData} 
                  height={300}
                  width={300}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-500 dark:text-gray-400">Building data not available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* End Use Comparison Table */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <FileText className="h-4 w-4 mr-1 text-emerald-500" />
          End Use Comparison
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Use Category</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Standard Benchmark
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  This Building
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(endUseBreakdownData.comparisonData || []).map((item, index) => {
                const difference = item.actual - item.standard;
                const isHigher = difference > 0;
                const isLower = difference < 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-800 dark:text-gray-200">{item.standard}%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-800 dark:text-gray-200">{item.actual}%</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                      <span className={`font-medium ${isHigher ? 'text-red-600 dark:text-red-400' : isLower ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {difference > 0 ? '+' : ''}{difference}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {endUseBreakdownData.comparisonData?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No comparison data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {endUseBreakdownData.comparisonData && endUseBreakdownData.comparisonData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Key Insights</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {endUseBreakdownData.comparisonData
                  .filter(item => Math.abs(item.actual - item.standard) >= 2)
                  .slice(0, 4)
                  .map((item, idx) => {
                    const diff = item.actual - item.standard;
                    const isHigher = diff > 0;
                    return (
                      <li key={idx}>
                        {item.name} energy usage is <span className={`${isHigher ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} font-medium`}>
                          {isHigher ? `${diff}% higher` : `${Math.abs(diff)}% lower`}
                        </span> than typical buildings of this type
                      </li>
                    );
                  })
                }
                {endUseBreakdownData.comparisonData.filter(item => Math.abs(item.actual - item.standard) >= 2).length === 0 && (
                  <li>Energy usage is similar to typical buildings of this type</li>
                )}
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Conservation Opportunities</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {endUseBreakdownData.comparisonData
                  .filter(item => item.actual - item.standard > 2)
                  .slice(0, 4)
                  .map((item, idx) => {
                    let opportunity = "";
                    if (item.name.includes("Cooling")) {
                      opportunity = "Optimize HVAC operation schedules and increase temperature setpoints during unoccupied hours";
                    } else if (item.name.includes("Heating")) {
                      opportunity = "Install programmable thermostats and reduce heating during unoccupied hours";
                    } else if (item.name.includes("Lighting")) {
                      opportunity = "Upgrade to LED fixtures and install occupancy sensors in common areas";
                    } else if (item.name.includes("Equipment") || item.name.includes("Plug")) {
                      opportunity = "Implement power management settings and encourage shutdown during off-hours";
                    } else if (item.name.includes("Ventilation")) {
                      opportunity = "Install demand-controlled ventilation systems and clean/maintain existing equipment";
                    } else {
                      opportunity = `Evaluate ${item.name.toLowerCase()} systems for efficiency improvements`;
                    }
                    
                    return (
                      <li key={idx}>
                        <span className="font-medium">{item.name}:</span> {opportunity}
                      </li>
                    );
                  })
                }
                {endUseBreakdownData.comparisonData.filter(item => item.actual - item.standard > 2).length === 0 && (
                  <li>Building is performing well compared to benchmarks. Continue regular maintenance of systems.</li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          * Standard values are based on ASHRAE reference buildings for {reportData.project?.property_primary_function || 'commercial properties'} of similar size and climate zone.
        </p>
      </div>
    </div>
  );
}; 