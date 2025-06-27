import React, { useEffect, useState } from 'react';
import { Activity, BarChart, Calculator, Cog, DollarSign, Droplet, FileText, Info, Loader2, Settings } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { MonthlyWaterChartContainer } from '@/features/water/MonthlyWaterChartContainer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { fetchTotalUtilityCost, fetchTotalUtilityUsage, fetchMonthlyUtilityData } from '@/services/energy-analysis';
import { FieldNotesProcessor } from '@/features/energy/field-notes';
import { WaterDataTable } from './WaterDataTable';
import axiosInstance from '@/services/common/axios-config';
import { Project } from '@/types/project';
import { apiClient } from '@/services';

import { ProjectWithDetails } from '@/types/project';

interface WaterOverviewProps {
  projectId: string;
  projectDetails?: Project;
  publicView?: boolean;
  setProjectDetails?: (project: ProjectWithDetails) => void;
}

export const WaterOverview: React.FC<WaterOverviewProps> = ({ projectId, projectDetails, setProjectDetails, publicView }) => {
  const [selectedDialog, setSelectedDialog] = useState<string | null>(null);
  const [totalWaterCost, setTotalWaterCost] = useState<number>(0);
  const [totalWaterUsage, setTotalWaterUsage] = useState<number>(0);
  const [isLoadingUtilityData, setIsLoadingUtilityData] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoadingMonthlyData, setIsLoadingMonthlyData] = useState(false);
  const [showFieldNotesDialog, setShowFieldNotesDialog] = useState(false);
  const [showCalculationsDialog, setShowCalculationsDialog] = useState(false);
  const [buildingArea, setBuildingArea] = useState<number>(0);

  // console.log('projectDetails:', projectDetails);

  // Fetch utility data
  useEffect(() => {
    async function loadUtilityData() {
      if (!projectId) return;
      
      try {
        setIsLoadingUtilityData(true);
        const [costData, usageData, projectResponse, monthlyWaterData] = await Promise.all([
          fetchTotalUtilityCost(projectId),
          fetchTotalUtilityUsage(projectId),
          axiosInstance.get(`/api/projects/${projectId}`),
          fetchMonthlyUtilityData(projectId, 'water')
        ]);
        
        // Get the project data
        const projectData = projectResponse.data || {};
        // Store the gross floor area for efficiency calculations
        const buildingArea = projectData.property_gross_floor_area || 0;
        
        // Debug the data
        console.log('Water cost data:', costData);
        console.log('Water usage data:', usageData);
        console.log('Building area:', buildingArea);
        console.log('Monthly water data:', monthlyWaterData);
        
        // Check for water data in costByType and usageByType
        let waterCost = 0;
        let waterUsage = 0;
        
        // Try to get water cost from costByType
        if (costData.costByType) {
          // First try the specific water meter type
          if (costData.costByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor']?.total) {
            waterCost = Number(costData.costByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor'].total);
          } 
          // Then try the generic 'Water' type
          else if (costData.costByType['Water']?.total) {
            waterCost = Number(costData.costByType['Water'].total);
          }
        }
        
        // Use the waterCost from the top-level property if we couldn't get it from costByType
        if (waterCost === 0 && costData.waterCost) {
          waterCost = Number(costData.waterCost);
        }
        
        // Try to get water usage from usageByType
        if (usageData.usageByType) {
          // First try the specific water meter type
          if (usageData.usageByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor']?.total) {
            waterUsage = Number(usageData.usageByType['Municipally Supplied Potable Water - Mixed Indoor/Outdoor'].total);
          } 
          // Then try the generic 'Water' type
          else if (usageData.usageByType['Water']?.total) {
            waterUsage = Number(usageData.usageByType['Water'].total);
          }
        }
        
        // Use the waterUsage from the top-level property if we couldn't get it from usageByType
        if (waterUsage === 0 && usageData.waterUsage) {
          waterUsage = Number(usageData.waterUsage);
        }
        
        // As a fallback, calculate totals from the monthly data
        if (waterUsage === 0 || waterCost === 0) {
          const totalMonthlyUsage = monthlyWaterData.reduce((sum, month) => sum + Number(month.usage || 0), 0);
          const totalMonthlyCost = monthlyWaterData.reduce((sum, month) => sum + Number(month.cost || 0), 0);
          
          if (waterUsage === 0 && totalMonthlyUsage > 0) {
            waterUsage = totalMonthlyUsage;
          }
          
          if (waterCost === 0 && totalMonthlyCost > 0) {
            waterCost = totalMonthlyCost;
          }
        }
        
        console.log('Final water cost:', waterCost);
        console.log('Final water usage:', waterUsage);
        
        // Save water cost and usage
        setTotalWaterCost(waterCost);
        setTotalWaterUsage(waterUsage);
        // Save building area
        setBuildingArea(buildingArea);
        // Save monthly data
        setMonthlyData(monthlyWaterData);
        
      } catch (error) {
        console.error('Failed to load utility data:', error);
      } finally {
        setIsLoadingUtilityData(false);
      }
    }
    
    loadUtilityData();
  }, [projectId]);

  const fetchMonthlyWaterData = async () => {
    if (!projectId) return;
    
    // If data is already loaded, don't reload
    if (monthlyData && monthlyData.length > 0) {
      return;
    }
    
    try {
      setIsLoadingMonthlyData(true);
      
      // Use the energy-analysis service function which handles URL encoding
      const data = await fetchMonthlyUtilityData(projectId, 'water');
      setMonthlyData(data);
    } catch (error) {
      console.error(`Failed to fetch monthly water data:`, error);
      setMonthlyData([]);
    } finally {
      setIsLoadingMonthlyData(false);
    }
  };

  // Add a function to handle successful field notes processing
  const handleFieldNotesSuccess = () => {
    setShowFieldNotesDialog(false);
    toast({
      title: "Field notes processed successfully",
      description: "Equipment data has been updated",
      duration: 3000
    });
    // You might want to refresh some data here
  };

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-2 mt-4">
      {!publicView && (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={() => setShowFieldNotesDialog(true)}
      >
        <FileText className="mr-2 h-4 w-4" />
        Process Field Notes
      </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={() => {
          fetchMonthlyWaterData();
          setSelectedDialog('monthly');
        }}
      >
        <BarChart className="mr-2 h-4 w-4" />
        View Monthly Data
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center"
        onClick={() => setShowCalculationsDialog(true)}
      >
        <Calculator className="mr-2 h-4 w-4" />
        Water Calculations
      </Button>
    </div>
  );

  const [loaderStart, setLoaderStart] = useState(false);

  const updateWaterScore = async () => {
    if (!projectId || !projectDetails.pm_id) return;

    try {
      setLoaderStart(true);

      const response = await apiClient.post<EnergyBreakdown>(`/api/portfolio-manager-prisma/properties/${projectDetails.pm_id}/update-water-score`, { projectId });

      setLoaderStart(false);
      
      if(response && response.data?.metrics?.water_score) {
        let water_score = response.data.metrics.water_score;

        if (typeof setProjectDetails === 'function' && projectDetails) {
          setProjectDetails({
            ...projectDetails,
            water_score,
            allowSkipStages: (projectDetails as any).allowSkipStages ?? false, // fallback if missing
          } as ProjectWithDetails);
        }
      } else {
        toast({
          title: "Error",
          description: "Water score not available",
          duration: 3000
        });
      }
    } catch (error) {
      setLoaderStart(false);
      console.error(`Error updating water score: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Area */}
      <Box className="p-6">
        <div className="flex items-center space-x-4">
          <Droplet className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold">Water</h2>
            <p className="text-muted-foreground">
              Overview of water usage, costs, and conservation opportunities.
            </p>
          </div>
        </div>
      </Box>

      {/* Generic Overview */}
      <div className="mb-6 p-4 bg-muted rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-emerald-500" />
          <span className="text-lg font-medium">Overview</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Water utilities manage the supply, treatment, and distribution of clean water for residential, commercial, and industrial use. They also handle wastewater collection and treatment to ensure environmental and public health standards are met. Reliable water services are vital for hygiene, agriculture, and overall community well-being.
        </p>
      </div>

      {/* Action Buttons */}
      {renderActionButtons()}

      {/* Water Analysis Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div 
          className="rounded-lg border border-emerald-500/20 bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            fetchMonthlyWaterData();
            setSelectedDialog('monthly');
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Total Water Usage</h3>
            <Droplet className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-lg font-bold mt-2">
            {isLoadingUtilityData ? 'Loading...' : `${totalWaterUsage.toLocaleString()} HCF`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">View Details</p>
        </div>
        <div
          className="rounded-lg border border-emerald-500/20 bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => {
            fetchMonthlyWaterData();
            setSelectedDialog('monthly-cost');
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Annual Water Cost</h3>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-lg font-bold mt-2">
            {isLoadingUtilityData ? 'Loading...' : `$${totalWaterCost.toLocaleString()}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">View Details</p>
        </div>
        <div
          className="rounded-lg border border-emerald-500/20 bg-card p-4 cursor-pointer"
          onClick={() => {
            fetchMonthlyWaterData();
            setSelectedDialog('monthly');
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Monthly Usage</h3>
            <BarChart className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-lg font-bold mt-2">View Details</div>
        </div>
        <div
          className="rounded-lg border border-emerald-500/20 bg-card p-4 cursor-pointer"
          onClick={() => setSelectedDialog('efficiency')}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Efficiency Metrics</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-lg font-bold mt-2">View Analysis</div>
        </div>
      </div>

      {/* Water Charts */}
      {projectDetails && (
        <div className="space-y-6">
          <Box className="p-6">
            <h2 className="text-2xl font-bold mb-3 text-emerald-700 dark:text-emerald-500">
              Current Water Score
              
              {!publicView && (
                <Button 
                  variant="link" 
                  size="sm" 
                  className="bg-gray-200 hover:bg-gray-300 text-black ml-2" 
                  onClick={updateWaterScore}
                >
                  {loaderStart ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )} Regenerate 
                </Button>
              )}
            </h2>

            <div className="border-2 border-gray-800 p-0 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Energy Star Logo */}
                <div className="bg-blue-400 p-4 flex items-center justify-center w-full md:w-64">
                  <div className="text-white text-center">
                    <div className="text-4xl font-bold">ENERGY STAR®</div>
                    <div className="text-xl">
                      Water Score
                    </div>
                  </div>
                </div>

                {/* Score and Building Info */}
                <div className="bg-gray-100 dark:bg-gray-900 flex-1 flex flex-col md:flex-row">
                  {/* Score display */}
                  <div className="flex items-center justify-center p-6 text-9xl font-bold md:w-1/3">
                    {projectDetails.water_score || 'N/A'}
                  </div>

                  {/* Building info */}
                  <div className="flex flex-col justify-center p-6 md:w-2/3">
                    <div className="text-xl font-bold mb-2">
                      {projectDetails.building_address}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="font-semibold">
                          Primary Property Type:
                        </span>
                        {projectDetails.property_primary_function ||
                          "Multifamily Housing"}
                      </div>
                      <div>
                        <span className="font-semibold">
                          Gross Floor Area (ft²):
                        </span>
                        {projectDetails.property_gross_floor_area}
                      </div>
                      <div>
                        <span className="font-semibold">Built:</span>
                        {projectDetails.property_year_built ||
                          "1988"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div className="bg-gray-100 dark:bg-gray-900 p-2 text-xs border-t border-gray-300">
                1. The ENERGY STAR score is a 1-100 assessment of a building's
                energy efficiency as compared with similar buildings nationwide,
                adjusting for climate and business activity.
              </div> */}
            </div>
          </Box>
        </div>
      )}

      {/* Water Charts */}
      <div className="space-y-6">
        {/* Monthly Water Chart - Full Width */}
        <MonthlyWaterChartContainer 
          projectId={projectId} 
        />
        
        {/* Conservation Tips - Full Width */}
        <Box className="p-6">
          <h3 className="text-xl font-semibold mb-4">Water Conservation Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Indoor Conservation</h4>
              <ul className="text-sm space-y-2">
                <li>• Install low-flow fixtures and aerators</li>
                <li>• Fix leaking toilets and faucets promptly</li>
                <li>• Upgrade to high-efficiency toilets and appliances</li>
                <li>• Implement sensor-based faucets in public restrooms</li>
              </ul>
            </div>
            <div className="bg-card/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Outdoor Conservation</h4>
              <ul className="text-sm space-y-2">
                <li>• Optimize irrigation schedules based on weather</li>
                <li>• Convert to drought-resistant landscaping</li>
                <li>• Install smart irrigation controllers</li>
                <li>• Consider rainwater harvesting systems</li>
              </ul>
            </div>
          </div>
        </Box>
      </div>

      {/* Dialogs for detailed views */}
      <Dialog open={selectedDialog === 'monthly'} onOpenChange={(open) => !open && setSelectedDialog(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Monthly Water Usage</DialogTitle>
          </DialogHeader>
          
          {isLoadingMonthlyData ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : monthlyData.length > 0 ? (
            <div className="flex flex-col w-full py-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usage (HCF)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {monthlyData.map((item, index) => {
                      const monthName = new Date(0, item.month - 1).toLocaleString('default', { month: 'long' });
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{monthName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">{item.usage.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-100 dark:bg-gray-700 font-medium">
                      <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">Total</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                        {monthlyData.reduce((sum, item) => sum + item.usage, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-gray-500 dark:text-gray-400">No monthly water data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Monthly Cost Data Dialog */}
      <Dialog open={selectedDialog === 'monthly-cost'} onOpenChange={(open) => !open && setSelectedDialog(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Monthly Water Cost</DialogTitle>
          </DialogHeader>
          
          {isLoadingMonthlyData ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : monthlyData.length > 0 ? (
            <div className="flex flex-col w-full py-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Year</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost ($)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {monthlyData.map((item, index) => {
                      const monthName = new Date(0, item.month - 1).toLocaleString('default', { month: 'long' });
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{monthName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.year}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">${item.cost.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-100 dark:bg-gray-700 font-medium">
                      <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">Total</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                        ${monthlyData.reduce((sum, item) => sum + item.cost, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-gray-500 dark:text-gray-400">No monthly cost data available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Efficiency Metrics Dialog */}
      <Dialog open={selectedDialog === 'efficiency'} onOpenChange={(open) => !open && setSelectedDialog(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Water Efficiency Metrics</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-card/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-center">Water Use Intensity</h4>
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="text-3xl font-bold text-blue-500">
                    {isLoadingUtilityData ? '...' : 
                      buildingArea > 0 ? (totalWaterUsage / buildingArea).toFixed(4) : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    HCF per sq.ft. per year
                  </div>
                </div>
              </div>
              <div className="bg-card/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-center">Cost Efficiency</h4>
                <div className="flex flex-col items-center justify-center h-32">
                  <div className="text-3xl font-bold text-blue-500">
                    {isLoadingUtilityData ? '...' : 
                      buildingArea > 0 ? `$${(totalWaterCost / buildingArea).toFixed(4)}` : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    per sq.ft. per year
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-6">
              Water efficiency metrics are calculated based on total annual water usage and building square footage.
              {buildingArea === 0 && ' Building area information is not available for this project.'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Water Calculations Dialog */}
      <Dialog open={showCalculationsDialog} onOpenChange={setShowCalculationsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Water Calculations</DialogTitle>
            <DialogDescription>
              Detailed water usage calculations and metrics for this facility
            </DialogDescription>
          </DialogHeader>
          <WaterDataTable projectId={projectId} />
        </DialogContent>
      </Dialog>

      {/* Add field notes dialog at the end of the component */}
      <Dialog open={showFieldNotesDialog} onOpenChange={setShowFieldNotesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Field Notes</DialogTitle>
            <DialogDescription>
              Extract equipment information from your field notes
            </DialogDescription>
          </DialogHeader>
          <FieldNotesProcessor 
            projectId={projectId} 
            onSuccess={handleFieldNotesSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}; 


export interface EnergyBreakdown {
  data: {
    metrics: {
      water_score: number,
    },
  },
  message: string,
  success: boolean,
}