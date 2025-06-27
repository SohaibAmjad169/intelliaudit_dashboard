import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import axiosInstance from '@/services/common/axios-config';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { fetchMonthlyUtilityData } from '@/services/energy-analysis';

// Constants for conversions
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HCF_TO_GALLONS = 748; // 1 HCF = 748 gallons
const GALLONS_TO_CCF = 1.336; // 1 gallon = 0.001336 CCF

interface WaterDataTableProps {
  projectId: string;
}

export const WaterDataTable: React.FC<WaterDataTableProps> = ({ projectId }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch water utility data
        const [rawMonthlyData, costResponse, usageResponse] = await Promise.all([
          fetchMonthlyUtilityData(projectId, 'water'),
          axiosInstance.get(`/api/utility-calcs/projects/${projectId}/total-cost`),
          axiosInstance.get(`/api/utility-calcs/projects/${projectId}/total-usage`)
        ]);

        // Filter out December 2023 data point as requested
        const monthlyData = rawMonthlyData.filter(item => !(item.month === 12 && item.year === 2023));
        console.log('Filtered out Dec 2023 from water data table');

        // Get project details for building info
        const projectResponse = await axiosInstance.get(`/api/projects/${projectId}`);

        // Process the data
        const costData = costResponse.data || {};
        const usageData = usageResponse.data || {};
        const projectData = projectResponse.data || {};

        // Extract water data from the responses
        const waterCost = costData.waterCost || 0;
        const waterUsage = usageData.waterUsage || 0;

        // Get usage data by type for water meters
        const waterMeters = ['Municipally Supplied Potable Water - Mixed Indoor/Outdoor', 'Water'];
        const waterUsageByType = waterMeters.reduce((total, meter) => {
          if (usageData.usageByType && usageData.usageByType[meter]) {
            return total + (usageData.usageByType[meter].total || 0);
          }
          return total;
        }, 0);

        // Process monthly data
        const processed = Array(12).fill(null).map((_, idx) => {
          const month = idx + 1;
          // Find matching month data
          const entry = monthlyData.find((d: any) => d.month === month);
          if (!entry) {
            return { month, usage: 0, cost: 0 };
          }
          return {
            month,
            usage: entry.usage || 0,
            cost: entry.cost || 0
          };
        });

        setData({
          project: projectData,
          monthlyData: processed,
          summary: {
            waterUsage: waterUsageByType > 0 ? waterUsageByType : waterUsage,
            waterCost,
            avgCostPerUnit: waterUsage > 0 ? waterCost / waterUsage : 0,
            year: new Date().getFullYear(),
          }
        });
      } catch (err: any) {
        console.error('Error fetching water data:', err);
        setError(err.response?.data?.message || 'Failed to load water data');
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
      let report = `WATER UTILITY REPORT\n`;
      report += `================================================\n\n`;

      const project = data.project || {};
      const buildingArea = project?.property_gross_floor_area || 20000;
      const summary = data.summary || {};

      report += `Project Name: ${project?.name || 'Unknown'}\n`;
      report += `Full Address: ${project?.building_address || 'Unknown'}\n`;
      report += `Building Type: ${project?.property_primary_function || 'Unknown'}\n`;
      report += `Year Built: ${project?.property_year_built || 'Unknown'}\n`;
      report += `Gross Floor Area: ${buildingArea.toLocaleString()} ft²\n\n`;

      // Water Data Table
      report += `WATER USAGE DATA TABLE\n`;
      report += `=================\n\n`;

      // Headers
      report += `Month\tYear\tHCF Usage\tGallons\tWater Cost\tCost/HCF\n`;

      // Current year
      const year = summary.year || new Date().getFullYear();

      // Monthly data
      let totalUsage = 0;
      let totalCost = 0;

      // Process each month
      for (let i = 0; i < 12; i++) {
        const month = i + 1;
        const monthName = MONTH_NAMES[i];

        const entry = data.monthlyData?.find((d: any) => d.month === month) || { usage: 0, cost: 0 };

        // Calculate derived values
        const gallons = entry.usage * HCF_TO_GALLONS;
        const costPerUnit = entry.usage > 0 ? entry.cost / entry.usage : 0;

        // Update totals
        totalUsage += entry.usage;
        totalCost += entry.cost;

        // Add row
        report += `${monthName}\t${year}\t`;
        report += `${Math.round(entry.usage)}\t`;
        report += `${Math.round(gallons).toLocaleString()}\t`;
        report += `$${entry.cost.toFixed(2)}\t`;
        report += `$${costPerUnit.toFixed(2)}\n`;
      }

      // Calculate derived totals
      const avgCostPerUnit = totalUsage > 0 ? totalCost / totalUsage : 0;

      // Add total row
      report += `TOTAL\t${year}\t`;
      report += `${Math.round(totalUsage)}\t`;
      report += `${Math.round(totalUsage * HCF_TO_GALLONS).toLocaleString()}\t`;
      report += `$${totalCost.toFixed(2)}\t`;
      report += `$${avgCostPerUnit.toFixed(2)}\n\n`;

      // Water Summary Table
      report += `WATER SUMMARY TABLE\n`;
      report += `=================\n\n`;
      report += `Effective Water Cost ($/HCF): $${avgCostPerUnit.toFixed(2)}\n`;
      report += `Effective Water Cost ($/1000 gal): $${(avgCostPerUnit / (HCF_TO_GALLONS/1000)).toFixed(2)}\n\n`;

      // Building metrics
      const waterIntensity = totalUsage / buildingArea; // HCF per square foot
      const waterCostIntensity = totalCost / buildingArea; // $ per square foot

      report += `Gross Floor Area: ${buildingArea.toLocaleString()} ft²\n`;
      report += `Building Type: ${project?.property_primary_function || 'Unknown'}\n`;
      report += `Year Built: ${project?.property_year_built || 'Unknown'}\n`;
      report += `Water Usage Intensity (HCF/ft²): ${waterIntensity.toFixed(3)}\n`;
      report += `Water Cost Intensity ($/ft²): $${waterCostIntensity.toFixed(2)}\n`;
      report += `Total Water Cost: $${totalCost.toFixed(2)}\n\n`;

      report += `Utility Bills Period: January ${year} through December ${year}\n\n`;
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
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
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
        No water data available for this project.
      </div>
    );
  }

  const summary = data.summary || {};

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Water Utility Report</h3>
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

      {/* Water Usage Data Table */}
      <div className="mb-8">
        <h4 className="text-md font-medium mb-4">Water Usage Data Table</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/80 border-b">
                <th className="px-3 py-2 text-left border-r">Month</th>
                <th className="px-3 py-2 text-center">HCF Usage</th>
                <th className="px-3 py-2 text-center">Gallons</th>
                <th className="px-3 py-2 text-center">Water Cost</th>
                <th className="px-3 py-2 text-center">Cost / HCF</th>
              </tr>
            </thead>
            <tbody>
              {/* Monthly data rows */}
              {Array.from({ length: 12 }, (_, i) => {
                const month = i + 1;
                const monthName = MONTH_NAMES[i];
                const entry = data.monthlyData?.find((d: any) => d.month === month) || { usage: 0, cost: 0 };

                // Calculate derived values
                const gallons = entry.usage * HCF_TO_GALLONS;
                const costPerUnit = entry.usage > 0 ? entry.cost / entry.usage : 0;

                return (
                  <tr key={month} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-1.5 font-medium border-r">{monthName}</td>
                    <td className="px-3 py-1.5 text-right">{Math.round(entry.usage).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right">{Math.round(gallons).toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-right text-foreground">${entry.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 py-1.5 text-right text-foreground">${costPerUnit.toFixed(2)}</td>
                  </tr>
                );
              })}

              {/* Totals row */}
              {(() => {
                // Calculate totals
                let totalUsage = 0;
                let totalCost = 0;

                // Sum all values
                data.monthlyData?.forEach((d: any) => {
                  totalUsage += d.usage || 0;
                  totalCost += d.cost || 0;
                });

                // Calculate derived values
                const totalGallons = totalUsage * HCF_TO_GALLONS;
                const avgCostPerUnit = totalUsage > 0 ? totalCost / totalUsage : 0;

                return (
                  <tr className="bg-muted/50 font-medium border-t border-t-gray-400">
                    <td className="px-3 py-2 border-r">TOTAL</td>
                    <td className="px-3 py-2 text-right">
                      {Math.round(totalUsage).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Math.round(totalGallons).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">
                      ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">
                      ${avgCostPerUnit.toFixed(2)}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Water Summary Table */}
      <div className="mt-6">
        <h4 className="text-md font-medium mb-4">Water Summary Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {(() => {
                  // Get summary data
                  const avgCostPerUnit = summary.avgCostPerUnit || 0;

                  return (
                    <>
                      <tr className="bg-blue-500/10">
                        <td className="px-3 py-2">Cost per HCF <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Real Data</span></td>
                        <td className="px-3 py-2 text-right font-medium">${avgCostPerUnit.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-blue-500/10">
                        <td className="px-3 py-2">Cost per 1,000 Gallons <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Calculated</span></td>
                        <td className="px-3 py-2 text-right font-medium">${(avgCostPerUnit / (HCF_TO_GALLONS/1000)).toFixed(2)}</td>
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
                  const project = data.project || {};
                  const buildingArea = project?.property_gross_floor_area || 20000;
                  const totalUsage = data.monthlyData?.reduce((sum: number, d: any) => sum + (d.usage || 0), 0) || 0;
                  const totalCost = data.monthlyData?.reduce((sum: number, d: any) => sum + (d.cost || 0), 0) || 0;

                  // Calculate metrics
                  const waterIntensity = totalUsage / buildingArea; // HCF per square foot
                  const waterCostIntensity = totalCost / buildingArea; // $ per square foot

                  return (
                    <>
                      <tr className="bg-emerald-500/10">
                        <td className="px-3 py-2">
                          Building Area
                          {project?.property_gross_floor_area ?
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Real Data</span> :
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500">Placeholder</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{buildingArea.toLocaleString()} ft²</td>
                      </tr>
                      <tr className="bg-emerald-500/10">
                        <td className="px-3 py-2">Water Usage Intensity <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Calculated</span></td>
                        <td className="px-3 py-2 text-right font-medium">{waterIntensity.toFixed(3)} HCF/ft²</td>
                      </tr>
                      <tr className="bg-emerald-500/10">
                        <td className="px-3 py-2">Water Cost Intensity <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Calculated</span></td>
                        <td className="px-3 py-2 text-right font-medium">${waterCostIntensity.toFixed(2)}/ft²</td>
                      </tr>
                      <tr className="bg-blue-500/10">
                        <td className="px-3 py-2">Total Water Cost <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Real Data</span></td>
                        <td className="px-3 py-2 text-right font-medium">${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
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
        Utility Bills Period: January {summary.year || new Date().getFullYear()} through December {summary.year || new Date().getFullYear()}
      </div>
    </div>
  );
};