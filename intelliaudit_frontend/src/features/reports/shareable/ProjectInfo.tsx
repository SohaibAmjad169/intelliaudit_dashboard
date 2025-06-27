import React from 'react';
import { Building2, Calendar, ClipboardList } from 'lucide-react';
import { ReportData } from './types';
import { formatCurrency, formatNumber, formatCostPerSqFt, formatEnergyUsagePerSqFt } from './utilities';

interface ProjectInfoProps {
  reportData: ReportData;
}

export const ProjectInfo: React.FC<ProjectInfoProps> = ({ reportData }) => {
  // Get square footage value from project
  const getSquareFootage = () => {
    if (!reportData.project) return 0;
    return reportData.project.property_gross_floor_area || 
           reportData.project.square_footage || 
           reportData.project.building_sqft || 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-base font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
        <ClipboardList className="h-5 w-5 mr-2 text-emerald-500" />
        Project Information
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400 text-lg">{reportData.project?.property_address}</p>
            <p className="text-gray-600 dark:text-gray-400">
              {[
                reportData.project?.property_city,
                reportData.project?.property_state,
                reportData.project?.property_postal_code
              ].filter(Boolean).join(', ')}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Building Type</div>
                <div className="font-medium flex items-center">
                  <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                  {reportData.project?.property_primary_function || 
                   reportData.project?.building_use_type || 
                   "Commercial Building"}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Year Built</div>
                <div className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {reportData.project?.property_year_built || "Not available"}
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Square Footage</div>
                <div className="font-medium">
                  {formatNumber(getSquareFootage())} ft²
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Units</div>
                <div className="font-medium">
                  {reportData.project?.total_units || 
                   (reportData.project?.building_info?.total_units) || 
                   "Not available"}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Energy Cost</div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(reportData.totalCost.total)}</div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">per year</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {formatCostPerSqFt(reportData.totalCost.total, getSquareFootage())}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 mb-1">Total Energy Usage</div>
          <div className="text-2xl font-bold text-emerald-600">{formatNumber(reportData.totalUsage.total)}</div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">kWh per year</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {formatEnergyUsagePerSqFt(reportData.totalUsage.total, getSquareFootage())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 