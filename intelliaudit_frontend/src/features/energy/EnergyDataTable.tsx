import React, { useState, useEffect, useMemo } from 'react';
import { FileText } from 'lucide-react';
import axiosInstance from '@/services/common/axios-config';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Constants for conversions
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const THERM_TO_MMBTU = 0.1; // 1 therm = 0.1 MMBtu
const KWH_TO_MMBTU = 0.003412; // 1 kWh = 0.003412 MMBtu

interface EnergyDataTableProps {
  projectId: string;
}

export const EnergyDataTable: React.FC<EnergyDataTableProps> = ({ projectId }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate totals using useMemo
  const calculatedTotals = useMemo(() => {
    let totalElectricUsage = 0;
    let totalElectricCost = 0;
    let totalGasUsage = 0;
    let totalGasCost = 0;

    data?.monthlyElectric?.forEach((d: any) => {
      totalElectricUsage += d.usage || 0;
      totalElectricCost += d.cost || 0;
    });
    
    data?.monthlyGas?.forEach((d: any) => {
      totalGasUsage += d.usage || 0;
      totalGasCost += d.cost || 0;
    });

    const totalElectricMMBtu = totalElectricUsage * KWH_TO_MMBTU;
    const totalGasMMBtu = totalGasUsage * THERM_TO_MMBTU;
    const avgCostPerKWh = totalElectricUsage > 0 ? totalElectricCost / totalElectricUsage : 0;
    const avgCostPerTherm = totalGasUsage > 0 ? totalGasCost / totalGasUsage : 0;
    const calculatedTotalCost = totalElectricCost + totalGasCost;

    return {
      totalElectricUsage,
      totalElectricCost,
      totalGasUsage,
      totalGasCost,
      totalElectricMMBtu,
      totalGasMMBtu,
      avgCostPerKWh,
      avgCostPerTherm,
      calculatedTotalCost
    };

  }, [data]); // Recalculate when data changes

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axiosInstance.get(`/api/reports/energy-summary?projectId=${projectId}`);
        setData(response.data);
      } catch (err: any) {
        console.error('Error fetching energy report data:', err);
        setError(err.response?.data?.message || 'Failed to load energy report data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [projectId]);

  const copyReportToClipboard = () => {
    if (!data) return;
    
    try {
      // Format the report data as text
      let report = `ASHRAE LEVEL II ENERGY AUDIT REPORT\n`;
      report += `================================================\n\n`;
      
      const project = data.project || {};
      const buildingArea = project?.property_gross_floor_area || 20000;
      
      report += `Project Name: ${project?.name || 'Unknown'}\n`;
      report += `Full Address: ${project?.building_address || 'Unknown'}\n`;
      report += `Building Type: ${project?.property_primary_function || 'Unknown'}\n`;
      report += `Year Built: ${project?.property_year_built || 'Unknown'}\n`;
      report += `Gross Floor Area: ${buildingArea.toLocaleString()} ft²\n\n`;
      
      // Utilities Data Table
      report += `UTILITIES DATA TABLE\n`;
      report += `=================\n\n`;
      
      // Headers
      report += `Month\tYear\tHDD\tCDD\tkWh Usage\tElectric Cost\tCost/kWh\tElectric MMBtu\t`;
      report += `Therms\tGas Cost\tCost/Therm\tGas MMBtu\n`;
      
      // Current year
      const year = data.summary?.year || new Date().getFullYear();
      
      // Use memoized totals
      const { 
        totalElectricUsage, totalElectricCost, totalGasUsage, totalGasCost,
        avgCostPerKWh, avgCostPerTherm, calculatedTotalCost, totalElectricMMBtu, totalGasMMBtu
       } = calculatedTotals;
      
      // Process each month
      for (let i = 0; i < 12; i++) {
        const month = i + 1;
        const monthName = MONTH_NAMES[i];
        
        const weather = data.weatherData?.find((d: any) => d.month === month) || {};
        const electric = data.monthlyElectric?.find((d: any) => d.month === month) || { usage: 0, cost: 0 };
        const gas = data.monthlyGas?.find((d: any) => d.month === month) || { usage: 0, cost: 0 };
        
        // Calculate derived values
        const electricMMBtu = electric.usage * KWH_TO_MMBTU;
        const gasMMBtu = gas.usage * THERM_TO_MMBTU;
        const costPerKWh = electric.usage > 0 ? electric.cost / electric.usage : 0;
        const costPerTherm = gas.usage > 0 ? gas.cost / gas.usage : 0;
        
        // Add row
        report += `${monthName}\t${year}\t`;
        report += `${Math.round(weather.hdd || 0)}\t`;
        report += `${Math.round(weather.cdd || 0)}\t`;
        report += `${Math.round(electric.usage)}\t`;
        report += `$${electric.cost.toFixed(2)}\t`;
        report += `$${costPerKWh.toFixed(2)}\t`;
        report += `${Math.round(electricMMBtu)}\t`;
        report += `${Math.round(gas.usage)}\t`;
        report += `$${gas.cost.toFixed(2)}\t`;
        report += `$${costPerTherm.toFixed(2)}\t`;
        report += `${Math.round(gasMMBtu)}\n`;
      }
      
      // Add total row
      report += `TOTAL\t${year}\t`;
      report += `—\t`;
      report += `—\t`;
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
      
      // Building metrics from summary
      const summary = data.summary || {};
      const eui = summary.eui || (totalElectricMMBtu + totalGasMMBtu) / buildingArea * 1000;
      const eci = summary.eci || (totalElectricCost + totalGasCost) / buildingArea;
      
      report += `Gross Floor Area: ${buildingArea.toLocaleString()} ft²\n`;
      report += `Building Type: ${project?.property_primary_function || 'Unknown'}\n`;
      report += `Year Built: ${project?.property_year_built || 'Unknown'}\n`;
      report += `EUI (kBtu/ft²): ${eui.toFixed(2)}\n`;
      report += `ECI ($/ft²): $${eci.toFixed(2)}\n`;
      report += `Total Utility Cost: $${calculatedTotalCost.toFixed(2)}\n\n`;
      
      report += `Utility Bills Period: January 2024 through December 2024\n\n`;
      report += `Report generated: ${new Date().toLocaleString()}\n`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(report);
      toast({
        title: "Report copied to clipboard",
        description: "You can now paste it into any document or spreadsheet",
        duration: 3000
      });
    } catch (err) {
      console.error('Error copying report to clipboard:', err);
      toast({
        title: "Failed to copy report",
        description: "Please try again or contact support",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p>Loading energy data, please wait...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-red-500 mb-2">Error loading data: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No energy data available for this project.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">ASHRAE Level II Energy Audit Report</h3>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-1"
          onClick={copyReportToClipboard}
        >
          <FileText className="h-4 w-4" />
          Copy to Clipboard
        </Button>
      </div>

      {/* Utilities Data Table */}
      <div className="mb-8">
        <h4 className="text-md font-medium mb-4">Utilities Data Table</h4>
        <div className="overflow-x-auto">
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
              {/* Monthly data rows */}
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const monthName = MONTH_NAMES[i];
                const weather = data.weatherData?.find((d: any) => d.month === month) || {};
                const electric = data.monthlyElectric?.find((d: any) => d.month === month) || { usage: 0, cost: 0 };
                const gas = data.monthlyGas?.find((d: any) => d.month === month) || { usage: 0, cost: 0 };
                
                // Calculate derived values
                const electricMMBtu = electric.usage * KWH_TO_MMBTU;
                const gasMMBtu = gas.usage * THERM_TO_MMBTU;
                const costPerKWh = electric.usage > 0 ? electric.cost / electric.usage : 0;
                const costPerTherm = gas.usage > 0 ? gas.cost / gas.usage : 0;

                return (
                  <tr key={month} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-medium border-r">{monthName}</td>
                    <td className="px-3 py-1.5 text-center">{Math.round(weather.hdd || 0).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-center border-r">{Math.round(weather.cdd || 0).toLocaleString()}</td>
                    
                    <td className="px-3 py-1.5 text-right">{Math.round(electric.usage).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-foreground">${electric.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-right text-foreground">${costPerKWh.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right border-r">{Math.round(electricMMBtu).toLocaleString()}</td>
                    
                    <td className="px-3 py-1.5 text-right">{Math.round(gas.usage).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-foreground">${gas.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-right text-foreground">${costPerTherm.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right">{Math.round(gasMMBtu).toLocaleString()}</td>
                  </tr>
                );
              })}
              
              {/* Totals row - use memoized totals */}
              <tr className="bg-muted/50 font-medium border-t border-t-gray-400">
                <td className="px-3 py-2 border-r">TOTAL</td>
                <td className="px-3 py-2 text-center">
                  —
                </td>
                <td className="px-3 py-2 text-center border-r">
                  —
                </td>
                
                <td className="px-3 py-2 text-right">{Math.round(calculatedTotals.totalElectricUsage).toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-foreground">${calculatedTotals.totalElectricCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right text-foreground">${calculatedTotals.avgCostPerKWh.toFixed(2)}</td>
                <td className="px-3 py-2 text-right border-r">{Math.round(calculatedTotals.totalElectricMMBtu).toLocaleString()}</td>
                
                <td className="px-3 py-2 text-right">{Math.round(calculatedTotals.totalGasUsage).toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-foreground">${calculatedTotals.totalGasCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-3 py-2 text-right text-foreground">${calculatedTotals.avgCostPerTherm.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Math.round(calculatedTotals.totalGasMMBtu).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Energy Summary Table */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-4">Energy Summary Table</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {(() => {
                  // Get summary data
                  const summary = data.summary || {};
                  const electricRate = summary.electricRate || 0;
                  const gasRate = summary.gasRate || 0;
                  
                  return (
                    <>
                      <tr className="bg-blue-500/10">
                        <td className="px-3 py-2">Effective Electrical $/kWh</td>
                        <td className="px-3 py-2 text-right font-medium">${electricRate.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-blue-500/10">
                        <td className="px-3 py-2">Effective Electrical $/MMBtu</td>
                        <td className="px-3 py-2 text-right font-medium">${(electricRate / KWH_TO_MMBTU).toFixed(2)}</td>
                      </tr>
                      <tr className="bg-orange-500/10">
                        <td className="px-3 py-2">Effective Gas $/Therm</td>
                        <td className="px-3 py-2 text-right font-medium">${gasRate.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-orange-500/10">
                        <td className="px-3 py-2">Effective Gas $/MMBtu</td>
                        <td className="px-3 py-2 text-right font-medium">${(gasRate / THERM_TO_MMBTU).toFixed(2)}</td>
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
                  // Get summary data
                  const summary = data.summary || {};
                  const project = data.project || {};
                  const buildingArea = project?.property_gross_floor_area || 20000;
                  
                  return (
                    <>
                      <tr className="bg-emerald-500/10">
                        <td className="px-3 py-2">Gross Conditioned Area</td>
                        <td className="px-3 py-2 text-right font-medium">{buildingArea.toLocaleString()} ft²</td>
                      </tr>
                      <tr className="bg-emerald-500/10">
                        <td className="px-3 py-2">EUI (kBtu/ft²)</td>
                        <td className="px-3 py-2 text-right font-medium">{summary.eui?.toFixed(2) || 'N/A'}</td>
                      </tr>
                      <tr className="bg-red-500/10">
                        <td className="px-3 py-2">ECI ($/ft²)</td>
                        <td className="px-3 py-2 text-right font-medium">${summary.eci?.toFixed(2) || 'N/A'}</td>
                      </tr>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <td className="px-3 py-2">Total Utility Cost</td>
                        <td className="px-3 py-2 text-right font-medium text-foreground">
                          ${calculatedTotals.calculatedTotalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || 'N/A'}
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
        Utility Bills Period: January 2024 through December 2024
      </div>
    </div>
  );
}; 