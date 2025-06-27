import React from 'react';
import { useMeasures } from '@/hooks/useMeasures';

interface Props {
  projectId: string;
  project?: any;
}

export const FinancialAnalysisTable: React.FC<Props> = ({ projectId, project }) => {
  const { eems, wems, rcms, isLoading } = useMeasures(projectId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading financial analysis...</div>;
  }

  // Combine all measures like in ExecutiveSummaryPage
  const allMeasures = [
    ...eems.map((m, idx) => ({ ...m, displayIndex: idx + 1, type: 'EEM' })),
    ...wems.map((m, idx) => ({ ...m, displayIndex: idx + 1, type: 'WEM' })),
    ...rcms.map((m, idx) => ({ ...m, displayIndex: idx + 1, type: 'RCM' }))
  ];

  if (allMeasures.length === 0) {
    return <div className="text-sm text-muted-foreground">No measures available for financial analysis.</div>;
  }

  const squareFootage = project?.property_gross_floor_area || 25314; // fallback

  // Helper functions (from ExecutiveSummaryPage)
  const getProjectCost = (measure: any) => {
    return measure.detailedCost?.total || 
      (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod
        ? measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod
        : 0);
  };

  const getMeasureTypePrefix = (type: string) => {
    switch (type) {
      case 'EEM': return 'EEM';
      case 'WEM': return 'WEM';
      case 'RCM': return 'RCM';
      default: return '';
    }
  };

  const getSimplePayback = (measure: any) => {
    return measure.estimatedSavings?.paybackPeriod || 0;
  };

  const getROI = (measure: any) => {
    if ((measure.estimatedSavings as any)?.roi !== undefined) {
      return (measure.estimatedSavings as any).roi;
    }
    const cost = getProjectCost(measure);
    if (cost === 0) return 0;
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return (annualSavings / cost) * 100;
  };

  const getNPV = (measure: any) => {
    if ((measure.estimatedSavings as any)?.npv !== undefined) {
      return (measure.estimatedSavings as any).npv;
    }
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const usefulLife = 15;
    const cost = getProjectCost(measure);
    return annualSavings * usefulLife - cost;
  };

  const getIRR = (measure: any) => {
    if ((measure.estimatedSavings as any)?.irr !== undefined) {
      return (measure.estimatedSavings as any).irr;
    }
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const cost = getProjectCost(measure);
    if (cost === 0) return 0;
    return (annualSavings / cost) * 100;
  };

  const getMIRR = (measure: any) => {
    const irr = getIRR(measure);
    return irr * 0.6;
  };

  const getAnnualNOI = (measure: any) => {
    return measure.estimatedSavings?.cost || 0;
  };

  const getAnnualSavingsPerSqFt = (measure: any, sqft: number) => {
    if (sqft <= 0) return 0;
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return annualSavings / sqft;
  };

  const getCostPerSqFt = (measure: any, sqft: number) => {
    if (sqft <= 0) return 0;
    const cost = getProjectCost(measure);
    return cost / sqft;
  };

  const getAssetValueIncrease = (measure: any) => {
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return annualSavings * 15;
  };

  // Formatting functions
  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "$0";
    return `$${Math.round(value).toLocaleString()}`;
  };

  const formatPercent = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0%";
    return `${Math.round(value)}%`;
  };

  const formatDecimal = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0.00";
    return value.toFixed(2);
  };

  // Special formatting for per-sq-ft values to show more precision
  const formatPerSqFt = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return "0.00";
    // For very small values, show 3 decimal places, otherwise 2
    if (value < 0.01) {
      return value.toFixed(3);
    }
    return value.toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Financial Analysis Summary</h4>
        <p className="text-xs text-muted-foreground mb-4">
          The following table summarizes the analysis of key financial metrics for each energy, water & retro-commissioning measure.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th colSpan={11} className="text-center py-2 px-2 font-medium border border-border">
                EEMs, WEMs & RCMs FINANCIAL ANALYSIS
              </th>
            </tr>
            <tr className="bg-muted/30">
              <th className="px-2 py-1 border border-border font-medium text-left text-xs">Measure #</th>
              <th className="px-2 py-1 border border-border font-medium text-left text-xs">Descriptions</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Simple Payback (yrs)</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">NPV</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">ROI</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">IRR</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">MIRR</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Annual Increase in NOI</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Annual Savings / sq.ft</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Cost / sq.ft</th>
              <th className="px-2 py-1 border border-border font-medium text-right text-xs">Increase in Asset Value</th>
            </tr>
          </thead>
          <tbody>
            {allMeasures.map((measure, index) => (
              <tr key={`financial-${measure.id || index}`} className="even:bg-muted/20">
                <td className="px-2 py-1 border border-border text-xs">
                  {getMeasureTypePrefix(measure.type)}{measure.displayIndex}
                </td>
                <td className="px-2 py-1 border border-border text-xs">
                  {measure.title}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  {formatDecimal(getSimplePayback(measure))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  {formatCurrency(getNPV(measure))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  {formatPercent(getROI(measure))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  {formatPercent(getIRR(measure))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  {formatPercent(getMIRR(measure))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  {formatCurrency(getAnnualNOI(measure))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  ${formatPerSqFt(getAnnualSavingsPerSqFt(measure, squareFootage))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  ${formatPerSqFt(getCostPerSqFt(measure, squareFootage))}
                </td>
                <td className="px-2 py-1 border border-border text-xs text-right">
                  {formatCurrency(getAssetValueIncrease(measure))}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-muted font-medium">
              <td colSpan={2} className="px-2 py-1 border border-border text-xs">
                TOTAL
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatDecimal(
                  allMeasures.length > 0
                    ? allMeasures.reduce((sum, m) => sum + getSimplePayback(m), 0) / allMeasures.length
                    : 0
                )}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatCurrency(allMeasures.reduce((sum, m) => sum + getNPV(m), 0))}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatPercent(
                  allMeasures.length > 0
                    ? allMeasures.reduce((sum, m) => sum + getROI(m), 0) / allMeasures.length
                    : 0
                )}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatPercent(
                  allMeasures.length > 0
                    ? allMeasures.reduce((sum, m) => sum + getIRR(m), 0) / allMeasures.length
                    : 0
                )}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatPercent(
                  allMeasures.length > 0
                    ? allMeasures.reduce((sum, m) => sum + getMIRR(m), 0) / allMeasures.length
                    : 0
                )}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatCurrency(allMeasures.reduce((sum, m) => sum + getAnnualNOI(m), 0))}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                ${formatPerSqFt(allMeasures.reduce((sum, m) => sum + getAnnualSavingsPerSqFt(m, squareFootage), 0))}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                ${formatPerSqFt(allMeasures.reduce((sum, m) => sum + getCostPerSqFt(m, squareFootage), 0))}
              </td>
              <td className="px-2 py-1 border border-border text-xs text-right">
                {formatCurrency(allMeasures.reduce((sum, m) => sum + getAssetValueIncrease(m), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}; 