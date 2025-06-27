import React from 'react';
import { useMeasures } from '@/hooks/useMeasures';

interface Props {
  projectId: string;
  project?: any;
}

export const PerformanceAnalysisTable: React.FC<Props> = ({ projectId, project }) => {
  const { eems, wems, rcms, isLoading } = useMeasures(projectId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading performance analysis...</div>;
  }

  // Combine all measures like in ExecutiveSummaryPage
  const allMeasures = [
    ...eems.map((m, idx) => ({ ...m, displayIndex: idx + 1, type: 'EEM' })),
    ...wems.map((m, idx) => ({ ...m, displayIndex: idx + 1, type: 'WEM' })),
    ...rcms.map((m, idx) => ({ ...m, displayIndex: idx + 1, type: 'RCM' }))
  ];

  if (allMeasures.length === 0) {
    return <div className="text-sm text-muted-foreground">No measures available for performance analysis.</div>;
  }

  // Helper functions (from ExecutiveSummaryPage)
  const getProjectCost = (measure: any) => {
    return measure.detailedCost?.total || 
      (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod
        ? measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod
        : 0);
  };

  const getIncentives = (measure: any) => {
    return measure.detailedCost?.incentives || 0;
  };

  const getUsefulLife = (measure: any) => {
    return measure.detailedCost?.usefulLife || 
           measure.usefulLife || 
           (measure.type === 'WEM' ? 12 : measure.type === 'RCM' ? 10 : 15);
  };

  const getMeasureTypePrefix = (type: string) => {
    switch (type) {
      case 'EEM': return 'EEM';
      case 'WEM': return 'WEM';
      case 'RCM': return 'RCM';
      default: return '';
    }
  };

  // Calculate totals
  const totals = {
    totalCostSavings: allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.cost || 0), 0),
    totalKwhSavings: allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.energy || 0), 0),
    totalKwSavings: allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.demand || 0), 0),
    totalThermsSavings: allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.therms || 0), 0),
    totalGallonsSavings: allMeasures.reduce((sum, m) => sum + (m.estimatedSavings?.water || 0), 0),
    totalProjectCost: allMeasures.reduce((sum, m) => sum + getProjectCost(m), 0),
    totalIncentives: allMeasures.reduce((sum, m) => sum + getIncentives(m), 0),
  };
  
  const totalNetCost = totals.totalProjectCost - totals.totalIncentives;

  // Formatting functions
  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "$0";
    return `$${Math.round(value).toLocaleString()}`;
  };

  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0";
    return Math.round(value).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">EEMs, WEMs & RCMs Performance Analysis Summary</h4>
        <p className="text-xs text-muted-foreground mb-4">
          The following table summarizes the overall performance of energy and water efficiency measures recommended as part of the Energy Management Plan.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th colSpan={11} className="text-center py-2 px-2 font-medium border border-border">
                EEMs, WEMs & RCMs SUMMARY TABLE
              </th>
            </tr>
            <tr className="bg-muted/30">
              <th className="px-2 py-1 border border-border font-medium text-left text-xs">Measure #</th>
              <th className="px-2 py-1 border border-border font-medium text-left text-xs">Descriptions</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Cost Savings</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">KWH Savings</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">KW Savings</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Therms Savings</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Gallons Savings</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Estimated Project Cost</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Incentives</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Net Cost</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Useful Life (Years)</th>
            </tr>
          </thead>
          <tbody>
            {allMeasures.map((measure, index) => {
              const projectCost = getProjectCost(measure);
              const incentives = getIncentives(measure);
              const netCost = projectCost - incentives;

              return (
                <tr key={`performance-${measure.id || index}`} className="even:bg-muted/20">
                  <td className="px-2 py-1 border border-border text-xs">
                    {getMeasureTypePrefix(measure.type)}{measure.displayIndex}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs">
                    {measure.title}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatCurrency(measure.estimatedSavings?.cost)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatNumber(measure.estimatedSavings?.energy)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatNumber(measure.estimatedSavings?.demand)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatNumber(measure.estimatedSavings?.therms)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatNumber(measure.estimatedSavings?.water)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatCurrency(projectCost)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatCurrency(incentives)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {formatCurrency(netCost)}
                  </td>
                  <td className="px-2 py-1 border border-border text-xs text-right">
                    {getUsefulLife(measure)}
                  </td>
                </tr>
              );
            })}
            
            {/* Totals Row */}
            <tr className="bg-muted font-medium">
              <td colSpan={2} className="px-2 py-1 border border-border text-xs">
                TOTAL
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatCurrency(totals.totalCostSavings)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatNumber(totals.totalKwhSavings)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatNumber(totals.totalKwSavings)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatNumber(totals.totalThermsSavings)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatNumber(totals.totalGallonsSavings)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatCurrency(totals.totalProjectCost)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatCurrency(totals.totalIncentives)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatCurrency(totalNetCost)}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {/* No total for useful life */}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}; 