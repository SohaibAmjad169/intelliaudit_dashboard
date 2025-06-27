import { useMeasures, DetailedMeasure } from '@/hooks/useMeasures';

interface MeasuresFinancialAnalysisProps {
  projectId: string;
}

export function MeasuresFinancialAnalysis({ projectId }: MeasuresFinancialAnalysisProps) {
  // Fetch measures data
  const { eems, wems, rcms, isLoading, error } = useMeasures(projectId);
  
  // Format currency for display
  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    return `$${Math.round(value).toLocaleString()}`;
  };

  // Format percentage for display
  const formatPercent = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0%';
    return `${Math.round(value)}%`;
  };
  
  // Format decimal for display
  const formatDecimal = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.0';
    return value.toFixed(1);
  };

  // Get measure type info
  const getMeasureTypePrefix = (type: string) => {
    switch (type) {
      case 'eem': return 'EEM';
      case 'wem': return 'WEM';
      case 'rcm': return 'RCM';
      default: return 'Measure';
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-6">Loading measures data...</div>;
  }
  
  if (error) {
    return <div className="text-center py-6 text-red-500">Error loading measures: {error}</div>;
  }
  
  // Prepare all measures for display
  const allMeasures = [
    ...eems.map((m, i) => ({ ...m, displayIndex: i + 1, type: 'eem' })),
    ...wems.map((m, i) => ({ ...m, displayIndex: i + 1, type: 'wem' })),
    ...rcms.map((m, i) => ({ ...m, displayIndex: i + 1, type: 'rcm' }))
  ];

  // Function to estimate project cost from payback period
  const getProjectCost = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    if (measure.detailedCost?.total) {
      return measure.detailedCost.total;
    } else if (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod) {
      return measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod;
    }
    return 0;
  };

  // Function to get simple payback
  const getSimplePayback = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    return measure.estimatedSavings?.paybackPeriod || 0;
  };

  // Function to get useful life
  const getUsefulLife = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    // Default useful life by measure type
    const defaultLife = measure.type === 'eem' ? 15 : measure.type === 'wem' ? 12 : 10;
    
    // Try to extract useful life from different possible locations
    if (typeof measure.equipmentDetails?.usefulLife === 'number') {
      return measure.equipmentDetails.usefulLife;
    }
    
    return defaultLife;
  };

  // Function to get ROI
  const getROI = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    // Check if roi exists, otherwise calculate a simple ROI based on cost and payback
    if ((measure.estimatedSavings as any)?.roi !== undefined) {
      return (measure.estimatedSavings as any).roi;
    }
    
    // Fallback calculation based on payback period
    const cost = getProjectCost(measure);
    if (cost === 0) return 0;
    
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return (annualSavings / cost) * 100; // Simple ROI as a percentage
  };

  // Function to get NPV
  const getNPV = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    // Check if npv exists, otherwise estimate
    if ((measure.estimatedSavings as any)?.npv !== undefined) {
      return (measure.estimatedSavings as any).npv;
    }
    
    // Fallback calculation: For example, a very simplified NPV based on annual savings
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const usefulLife = getUsefulLife(measure);
    const cost = getProjectCost(measure);
    
    // Simplified NPV (not accounting for discount rates properly)
    return (annualSavings * usefulLife) - cost;
  };

  // Function to get IRR
  const getIRR = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    // Check if irr exists, otherwise estimate
    if ((measure.estimatedSavings as any)?.irr !== undefined) {
      return (measure.estimatedSavings as any).irr;
    }
    
    // Fallback calculation: For example, a very simplified IRR approximation
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const cost = getProjectCost(measure);
    if (cost === 0) return 0;
    
    // Simplified approximation (not a true IRR)
    return (annualSavings / cost) * 100;
  };

  // Function to calculate MIRR (Modified Internal Rate of Return)
  const getMIRR = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    // For demonstration, we'll use a simplified calculation based on IRR
    // In a real implementation, this would involve more complex financial calculations
    const irr = getIRR(measure);
    return irr * 0.6; // Simple estimation for demo purposes
  };

  // Function to calculate Annual Increase in NOI
  const getAnnualNOI = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    return measure.estimatedSavings?.cost || 0;
  };

  // Function to calculate Annual Savings per sq.ft
  const getAnnualSavingsPerSqFt = (measure: DetailedMeasure & { displayIndex: number; type: string }, squareFootage: number) => {
    if (squareFootage <= 0) return 0;
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return annualSavings / squareFootage;
  };

  // Function to calculate Cost per sq.ft
  const getCostPerSqFt = (measure: DetailedMeasure & { displayIndex: number; type: string }, squareFootage: number) => {
    if (squareFootage <= 0) return 0;
    const cost = getProjectCost(measure);
    return cost / squareFootage;
  };

  // Function to calculate Increase in Asset Value
  const getAssetValueIncrease = (measure: DetailedMeasure & { displayIndex: number; type: string }) => {
    // A common rule of thumb is that a property's value increases by 10-20 times the annual energy savings
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return annualSavings * 15; // Using 15x as a multiplier
  };
  
  // Placeholder for building square footage - should be fetched from project data
  const squareFootage = 60000; // Example value
  
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
        D. EEM, WEM & RCM Financial Analysis Summary
      </h2>
      
      <p className="mb-6 dark:text-gray-300">
        The following table summarizes the analysis of key financial metrics for each energy, water & retro-commissioning measure.
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              <th colSpan={11} className="text-center py-3 px-4 font-semibold text-base border border-gray-300 dark:border-gray-600">
                EEMs, WEMs & RCMs FINANCIAL ANALYSIS
              </th>
            </tr>
            <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">Measure #</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">Descriptions</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Simple Payback (yrs)</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">NPV</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">ROI</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">IRR</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">MIRR</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Annual Increase in NOI</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Annual Savings / sq.ft</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Cost / sq.ft</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Increase in Asset Value</th>
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {allMeasures.map((measure, index) => {
              return (
                <tr key={`financial-${measure.id || index}`} className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                    {getMeasureTypePrefix(measure.type)} {measure.displayIndex}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                    {measure.title}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatDecimal(getSimplePayback(measure))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatCurrency(getNPV(measure))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatPercent(getROI(measure))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatPercent(getIRR(measure))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatPercent(getMIRR(measure))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatCurrency(getAnnualNOI(measure))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    ${formatDecimal(getAnnualSavingsPerSqFt(measure, squareFootage))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    ${formatDecimal(getCostPerSqFt(measure, squareFootage))}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatCurrency(getAssetValueIncrease(measure))}
                  </td>
                </tr>
              );
            })}
            
            {/* Totals Row */}
            <tr className="bg-gray-300 dark:bg-gray-600 font-semibold">
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3" colSpan={2}>
                TOTAL
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatDecimal(allMeasures.reduce((sum, m) => sum + getSimplePayback(m), 0) / allMeasures.length)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatCurrency(allMeasures.reduce((sum, m) => sum + getNPV(m), 0))}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatPercent(allMeasures.reduce((sum, m) => sum + getROI(m), 0) / allMeasures.length)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatPercent(allMeasures.reduce((sum, m) => sum + getIRR(m), 0) / allMeasures.length)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatPercent(allMeasures.reduce((sum, m) => sum + getMIRR(m), 0) / allMeasures.length)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatCurrency(allMeasures.reduce((sum, m) => sum + getAnnualNOI(m), 0))}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                ${formatDecimal(allMeasures.reduce((sum, m) => sum + getAnnualSavingsPerSqFt(m, squareFootage), 0))}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                ${formatDecimal(allMeasures.reduce((sum, m) => sum + getCostPerSqFt(m, squareFootage), 0))}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatCurrency(allMeasures.reduce((sum, m) => sum + getAssetValueIncrease(m), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
} 