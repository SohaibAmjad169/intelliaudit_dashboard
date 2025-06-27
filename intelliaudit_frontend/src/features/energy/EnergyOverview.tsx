import React, { useState, useEffect, useMemo } from 'react';
import { Activity, DollarSign, Zap, FileText, BarChart3, Building2, Info } from 'lucide-react';
import { Box } from '@/components/ui/box';
import { useUtilityCost, useUtilityUsage, useEndUseBreakdown } from '@/hooks/data/useEnergyData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { FieldNotesProcessor } from '@/features/energy/field-notes';
import { PortfolioManagerForm } from '@/features/energy/portfolio-manager';
import { EndUseBreakdownChart } from '@/features/energy/EndUseBreakdownChart';
import { MonthlyEnergyChartContainer } from '@/features/energy/MonthlyEnergyChartContainer';
import { BaselineEndUseComparison } from '@/features/energy/BaselineEndUseComparison';
import { WeatherEnergyCorrelationChart } from '@/features/weather';
import { EnergyDataTable } from '@/features/energy/EnergyDataTable';
import axiosInstance from '@/services/common/axios-config';
import { EnergyChart } from './EnergyChart';
import EnergyStarBenchmarking from './EnergyStarBenchmarking';
import EnergyUseAnalysis from './EnergyUseAnalysis';

interface EnergyOverviewProps {
  projectId: string;
  project?: {
    id: string;
    raw_notes?: string;
    [key: string]: any;
  };
  publicView?: boolean;
}

export const EnergyOverview: React.FC<EnergyOverviewProps> = ({ projectId, project, publicView }) => {
  const { data: costData, isLoading: isLoadingCostData } = useUtilityCost(projectId);
  const { data: usageData, isLoading: isLoadingUsageData } = useUtilityUsage(projectId);
  const { data: endUseData, isLoading: isLoadingEndUseData } = useEndUseBreakdown(projectId);
  
  // State for monthly data
  const [monthlySummaryData, setMonthlySummaryData] = useState<any>(null);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(true);
  const [fetchErrorMonthly, setFetchErrorMonthly] = useState<string | null>(null);

  // Fetch monthly summary data
  useEffect(() => {
    async function fetchMonthlySummary() {
      if (!projectId) return;
      setIsLoadingMonthly(true);
      setFetchErrorMonthly(null);
      try {
        const response = await axiosInstance.get(`/api/reports/energy-summary?projectId=${projectId}`);
        setMonthlySummaryData(response.data);
      } catch (error: any) { 
        console.error("Error fetching monthly summary data for overview:", error);
        setFetchErrorMonthly(error.message || "Failed to load monthly data");
        setMonthlySummaryData(null);
      } finally {
         setIsLoadingMonthly(false);
      }
    }
    fetchMonthlySummary();
  }, [projectId]);

  // Calculate costs from monthly data
   const calculatedCosts = useMemo(() => {
    let totalElectricCost = 0;
    let totalGasCost = 0;

    monthlySummaryData?.monthlyElectric?.forEach((d: any) => {
      totalElectricCost += d.cost || 0;
    });
    monthlySummaryData?.monthlyGas?.forEach((d: any) => {
      totalGasCost += d.cost || 0;
    });
    const calculatedTotalCost = totalElectricCost + totalGasCost;
    const electricCostPercent = calculatedTotalCost > 0 ? Math.round((totalElectricCost / calculatedTotalCost) * 100) : 0;
    const gasCostPercent = calculatedTotalCost > 0 ? Math.round((totalGasCost / calculatedTotalCost) * 100) : 0;

    return { 
      totalElectricCost, 
      totalGasCost, 
      calculatedTotalCost,
      electricCostPercent,
      gasCostPercent
     };
  }, [monthlySummaryData]);

  const [showFieldNotesDialog, setShowFieldNotesDialog] = useState(false);
  const [showPortfolioManagerDialog, setShowPortfolioManagerDialog] = useState(false);
  const [selectedDialog, setSelectedDialog] = useState<string | null>(null);
  
  const isLoading = isLoadingCostData || isLoadingUsageData || isLoadingMonthly;
  const error = fetchErrorMonthly;

  // Extract values with defaults
  const electricCost = costData?.electricCost || 0;
  const naturalGasCost = costData?.naturalGasCost || 0;
  const totalCost = costData?.totalCost || 0;

  const electricUsage = usageData?.totalElectric || 0;
  const naturalGasUsage = usageData?.naturalGasUsage || 0; // This is in therms
  const totalEnergyUsage = usageData?.totalEnergyUsage || 0;

  // Use calculated costs
  const { totalElectricCost, totalGasCost, calculatedTotalCost, electricCostPercent, gasCostPercent } = calculatedCosts;

  // Handle successful field notes processing
  const handleFieldNotesSuccess = () => {
    setShowFieldNotesDialog(false);
    toast({
      title: "Field notes processed successfully",
      description: "Equipment data has been updated",
      duration: 3000
    });
  };

  return (
    <div className="space-y-6 px-6">
      <Box className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Zap className="w-8 h-8 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold">Utilities</h2>
              <p className="text-muted-foreground">
                Overview of energy usage and costs for this project.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setSelectedDialog('calculations')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Energy Calculations
            </Button>
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
          Energy Utilities refer to companies or systems that produce, transmit, and distribute energy—such as electricity, natural gas, and renewable sources—to homes, businesses, and industries. These services are essential for daily operations and infrastructure, supporting everything from lighting and heating to manufacturing and transportation.
        </p>
      </div>
      
      <EnergyChart projectId={projectId} project={project} publicView={publicView} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Electric Panel */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="bg-blue-500/10 p-4">
            <h3 className="text-lg font-medium flex items-center">
              <Zap className="w-5 h-5 text-blue-500 mr-2" />
               Electric
             </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Annual Usage:</span>
              <span className="font-medium text-lg">
                {isLoading ? 'Loading...' : `${Math.round(electricUsage).toLocaleString()} kWh`}
              </span>
             </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Annual Cost:</span>
              <span className="font-medium text-lg">
                {isLoading ? 'Loading...' : `$${Math.round(totalElectricCost).toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Percent of Total Cost:</span>
              <span className="font-medium text-lg">
                {isLoading ? 'Loading...' : `${electricCostPercent}%`}
              </span>
             </div>
           </div>
        </div>

        {/* Natural Gas Panel */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="bg-orange-500/10 p-4">
            <h3 className="text-lg font-medium flex items-center">
              <Activity className="w-5 h-5 text-orange-500 mr-2" />
               Natural Gas
             </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Annual Usage:</span>
              <span className="font-medium text-lg">
                {isLoading ? 'Loading...' : `${Math.round(naturalGasUsage).toLocaleString()} therms`}
              </span>
             </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Annual Cost:</span>
              <span className="font-medium text-lg">
                {isLoading ? 'Loading...' : `$${Math.round(totalGasCost).toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Percent of Total Cost:</span>
              <span className="font-medium text-lg">
                {isLoading ? 'Loading...' : `${gasCostPercent}%`}
              </span>
             </div>
           </div>
        </div>
      </div>

      {/* Total Cost Summary */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 bg-primary/10">
          <h3 className="text-lg font-medium flex items-center">
            <DollarSign className="w-5 h-5 text-primary mr-2" />
              Total Annual Utility Cost
            </h3>
           </div>
        <div className="p-6">
          <div className="text-3xl font-bold">
            {isLoading ? 'Loading...' : `$${Math.round(calculatedTotalCost).toLocaleString()}`}
           </div>
         </div>
      </div>

      <Box className="p-6">
        <EnergyStarBenchmarking projectId={projectId} />
      </Box>

      <Box className="p-6">
        <EnergyUseAnalysis projectId={projectId} />
      </Box>

      {/* Weather Energy Correlation Chart */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <WeatherEnergyCorrelationChart projectId={projectId} />
      </div>

      {/* Field Notes Dialog */}
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

      {/* Portfolio Manager Dialog */}
      <Dialog open={showPortfolioManagerDialog} onOpenChange={setShowPortfolioManagerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Portfolio Manager</DialogTitle>
            <DialogDescription>
              Connect to Portfolio Manager to import energy data
            </DialogDescription>
          </DialogHeader>
          <PortfolioManagerForm 
            projectId={projectId}
            onDataLoaded={() => {
              setShowPortfolioManagerDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* End Use Breakdown Dialog */}
      <Dialog open={selectedDialog === 'detailed'} onOpenChange={(open) => !open && setSelectedDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>End Use Breakdown</DialogTitle>
            <DialogDescription>
              Detailed breakdown of energy usage by end use category
            </DialogDescription>
          </DialogHeader>
          {isLoadingEndUseData ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : endUseData ? (
            <div className="space-y-6">
              <EndUseBreakdownChart data={endUseData} height={300} />
              <BaselineEndUseComparison data={endUseData} height={300} />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No end use breakdown data available
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Monthly Data Dialog */}
      <Dialog open={selectedDialog === 'monthly'} onOpenChange={(open) => !open && setSelectedDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Monthly Energy Usage</DialogTitle>
            <DialogDescription>
              Monthly breakdown of energy usage and costs
            </DialogDescription>
          </DialogHeader>
          <MonthlyEnergyChartContainer projectId={projectId} />
        </DialogContent>
      </Dialog>

      {/* Energy Calculations Dialog */}
      <Dialog open={selectedDialog === 'calculations'} onOpenChange={(open) => !open && setSelectedDialog(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Energy Calculations</DialogTitle>
            <DialogDescription>
              Detailed energy audit data and calculations
            </DialogDescription>
          </DialogHeader>
          <EnergyDataTable projectId={projectId} />
        </DialogContent>
      </Dialog>
    </div>
  );
}; 
