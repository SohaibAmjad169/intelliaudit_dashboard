import { useMeasures, DetailedMeasure } from '@/hooks/useMeasures';

interface EEMsCostSavingsTableProps {
  projectId: string;
}

export function EEMsCostSavingsTable({ projectId }: EEMsCostSavingsTableProps) {
  // Fetch measures data
  const { eems, isLoading, error } = useMeasures(projectId);
  
  // Format numbers for display
  const formatNumber = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    return Math.round(value).toLocaleString();
  };
  
  // Format currency for display
  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '$0';
    return `$${Math.round(value).toLocaleString()}`;
  };

  // Calculate totals for all EEMs
  const calculateTotals = () => {
    let totalCostSavings = 0;
    let totalKwhSavings = 0;
    let totalKwSavings = 0;
    let totalThermsSavings = 0;
    let totalSteamSavings = 0;
    let totalGallonsSavings = 0;
    let totalProjectCost = 0;
    let totalIncentives = 0;
    let totalNetCost = 0;
    
    eems.forEach(measure => {
      // Add cost savings
      totalCostSavings += measure.estimatedSavings?.cost || 0;
      
      // Add energy savings
      totalKwhSavings += measure.estimatedSavings?.energy || 0;
      totalKwSavings += measure.estimatedSavings?.demand || 0;
      totalThermsSavings += measure.estimatedSavings?.therms || 0;
      totalSteamSavings += measure.estimatedSavings?.steam || 0;
      
      // Add water savings
      totalGallonsSavings += measure.estimatedSavings?.water || 0;
      
      // Add project costs and incentives
      if (measure.detailedCost) {
        totalProjectCost += measure.detailedCost.total || 0;
        totalIncentives += measure.detailedCost.incentives || 0;
      } else if (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod) {
        // Estimate cost based on payback period
        const estimatedCost = measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod;
        totalProjectCost += estimatedCost;
      }
    });
    
    // Calculate net cost
    totalNetCost = totalProjectCost - totalIncentives;
    
    return {
      totalCostSavings,
      totalKwhSavings,
      totalKwSavings,
      totalThermsSavings,
      totalSteamSavings,
      totalGallonsSavings,
      totalProjectCost,
      totalIncentives,
      totalNetCost
    };
  };
  
  const totals = calculateTotals();
  
  // Function to estimate project cost from payback period
  const getProjectCost = (measure: DetailedMeasure) => {
    if (measure.detailedCost?.total) {
      return measure.detailedCost.total;
    } else if (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod) {
      return measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod;
    }
    return 0;
  };
  
  // Function to get incentives amount
  const getIncentives = (measure: DetailedMeasure) => {
    return measure.detailedCost?.incentives || 0;
  };
  
  // Function to get useful life
  const getUsefulLife = (measure: DetailedMeasure) => {
    // Default useful life for EEMs is typically 15 years
    const defaultLife = 15;
    
    // Try to extract useful life from equipment details
    if (typeof measure.equipmentDetails?.usefulLife === 'number') {
      return measure.equipmentDetails.usefulLife;
    }
    
    return defaultLife;
  };
  
  if (isLoading) {
    return <div className="text-center py-6">Loading measures data...</div>;
  }
  
  if (error) {
    return <div className="text-center py-6 text-red-500">Error loading measures: {error}</div>;
  }

  // If no EEMs are found
  if (eems.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          C. EEMs Cost Savings Summary Table
        </h2>
        <p className="mb-4">No Energy Efficiency Measures (EEMs) have been added to this project.</p>
      </section>
    );
  }
  
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">
        C. EEMs Cost Savings Summary Table
      </h2>
      
      <p className="mb-6 dark:text-gray-300">
        The following table summarizes the overall performance of energy and water efficiency measures 
        recommended as part of the Energy Management Plan.
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-4">
          {/* Header */}
          <thead>
            <tr className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              <th colSpan={12} className="text-center py-3 px-4 border border-gray-300 dark:border-gray-600 font-semibold text-base">
                ENERGY EFFICIENCY MEASURE (EEM) TABLE
              </th>
            </tr>
            <tr className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">EEM #</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-left">Descriptions</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Cost Savings</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">KWH Savings</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">KW Savings</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Therms Savings</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Lbs Steam Savings</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Gallons Savings</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Estimated Project Cost</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Incentives</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Net Cost</th>
              <th className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">Useful Life (Years)</th>
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {eems.map((measure, index) => {
              const projectCost = getProjectCost(measure);
              const incentives = getIncentives(measure);
              const netCost = projectCost - incentives;
              
              return (
                <tr key={measure.id || index} className="bg-gray-100 dark:bg-gray-800 even:bg-white even:dark:bg-gray-700">
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                    EEM {index + 1}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3">
                    {measure.title}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatCurrency(measure.estimatedSavings?.cost)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatNumber(measure.estimatedSavings?.energy)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatNumber(measure.estimatedSavings?.demand)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatNumber(measure.estimatedSavings?.therms)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatNumber(measure.estimatedSavings?.steam)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatNumber(measure.estimatedSavings?.water)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatCurrency(projectCost)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatCurrency(incentives)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {formatCurrency(netCost)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                    {getUsefulLife(measure)}
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
                {formatCurrency(totals.totalCostSavings)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatNumber(totals.totalKwhSavings)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatNumber(totals.totalKwSavings)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatNumber(totals.totalThermsSavings)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatNumber(totals.totalSteamSavings)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatNumber(totals.totalGallonsSavings)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatCurrency(totals.totalProjectCost)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatCurrency(totals.totalIncentives)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {formatCurrency(totals.totalNetCost)}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 py-2 px-3 text-right">
                {/* No total for useful life */}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footnotes for the table */}
      <p className="text-sm italic mt-2 dark:text-gray-400">
        *Energy and cost savings resulting from EEM #{eems.length > 0 ? '1' : ''} will be realized by tenants as well as landlord.
      </p>
    </section>
  );
} 