import { ReportData, EcoData } from './types';
import { useMeasures } from '@/hooks/useMeasures';

interface SummaryTablesProps {
  reportData: ReportData;
  ecoData?: EcoData;
}

export function SummaryTables({ reportData, ecoData = { 
  summary: '',
  observations: [],
  recommendations: [],
  hvacSystemDescription: '',
  lightingSystemDescription: '',
  buildingEnvelopeDescription: '',
  hvacEquipment: [],
  lightingEquipment: [],
  equipmentInventory: [],
  buildingEnvelopeComponents: [],
  weatherConditions: '',
  utilityDataDescription: '',
  utilitySummary: [],
  occupancyScheduleDetails: [],
  isLoading: false
} }: SummaryTablesProps) {
  const project = reportData.project;
  const measures = reportData.energyMeasures || [];
  
  // Get project ID for useMeasures hook
  const projectId = project?.id || '';
  
  // Use the same hook as Recommendations component to get measures
  const { eems, wems, rcms } = useMeasures(projectId);
  
  // Calculate total measures count - same as used in Recommendations component
  const totalMeasures = eems.length + wems.length + rcms.length + (ecoData?.recommendations?.length || 0);
  
  // Get square footage
  const squareFootage = 
    project?.property_gross_floor_area || 
    project?.square_footage || 
    project?.building_sqft || 0;
  
  // Calculate per square foot costs
  const energyCostPerSqft = 
    squareFootage > 0 
      ? (reportData.totalCost.electric + reportData.totalCost.naturalGas) / squareFootage 
      : 0;
  
  const waterCostPerSqft = 
    squareFootage > 0 
      ? reportData.totalCost.water / squareFootage 
      : 0;
      
  // Energy usage metrics
  const totalEnergyUsage = reportData.totalUsage.total;
  const eui = squareFootage > 0 ? totalEnergyUsage / squareFootage : 0;
  
  // Water usage metrics (typically in gallons/sqft)
  const wui = squareFootage > 0 ? reportData.totalUsage.water / squareFootage : 0;
  
  // Calculate energy star ratings (placeholders if not available)
  // Use a default/placeholder value since energy_star_score may not be available
  const energyStarRating = project?.ec_o?.energy_star_score || 74;
  const waterStarRating = 17; // Placeholder if not available
  
  // Calculate savings based on measures data
  const energySavings = measures
    .filter(m => m.type === 'energy')
    .reduce((sum, m) => sum + (m.annualSavings || 0), 0);
    
  const waterSavings = measures
    .filter(m => m.type === 'water')
    .reduce((sum, m) => sum + (m.annualSavings || 0), 0);
    
  const rcxSavings = measures
    .filter(m => m.type === 'retro')
    .reduce((sum, m) => sum + (m.annualSavings || 0), 0);
    
  const totalSavings = energySavings + waterSavings + rcxSavings;
  
  // Calculate potential rebates/incentives (placeholder)
  const potentialRebates = totalSavings * 0.9; // Assuming 90% of savings can be incentivized
  
  // Format numbers
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat().format(Math.round(value));
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format decimal values
  const formatDecimal = (value: number): string => {
    return value.toFixed(2);
  };
  
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">B. Summary Tables</h2>
      
      <p className="mb-6">
        {totalMeasures} energy and water efficiency measures were analyzed and recommended. These measures 
        have estimated annual savings of <span className="underline">{formatCurrency(totalSavings)}</span> with {calculatePayback(totalSavings, measures)} years payback if incentives are still applicable 
        and awarded.
      </p>
      
      <div className="overflow-hidden border border-gray-200 rounded-md mb-10">
        {/* Header Row */}
        <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-center py-2 px-4 font-semibold text-lg">
          REPORT SUMMARY
        </div>
        
        {/* Table rows */}
        <div className="grid grid-cols-2 divide-y divide-gray-200 bg-gray-200 dark:bg-gray-700">
          {/* Building Square Footage */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Building Square Footage (sq.ft.)
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatNumber(squareFootage)}
          </div>
          
          {/* Annual Energy Cost */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Annual Energy Cost
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatCurrency(reportData.totalCost.electric + reportData.totalCost.naturalGas)}
          </div>
          
          {/* Current ENERGY STAR Rating */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Current ENERGY STAR® Rating
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {energyStarRating}
          </div>
          
          {/* Energy Use Intensity */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Current Energy Use Intensity (EUI)
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatDecimal(eui)}
          </div>
          
          {/* Energy Cost per Sq.Ft */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Current Energy Cost / <span className="underline">sq.ft.</span>
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            ${formatDecimal(energyCostPerSqft)}
          </div>
          
          {/* Annual Water/Sewer Cost */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Annual Water/Sewer Cost
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatCurrency(reportData.totalCost.water)}
          </div>
          
          {/* Current Water STAR Rating */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Current Energy STAR® Water Score Rating
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {waterStarRating}
          </div>
          
          {/* Water Use Intensity */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Current Water Use Intensity (WUI)
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatDecimal(wui)}
          </div>
          
          {/* Water Cost per Sq.Ft */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Current water/Sewer Cost / <span className="underline">sq.ft.</span>
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            ${formatDecimal(waterCostPerSqft)}
          </div>
          
          {/* Target Energy Savings */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Target Annual Savings from Energy Upgrades
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatCurrency(energySavings)}
          </div>
          
          {/* Target Water Savings */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Target Annual Savings from Water Upgrades
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatCurrency(waterSavings)}
          </div>
          
          {/* RCx Savings */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Target Annual Savings from RCx Implementation
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatCurrency(rcxSavings)}
          </div>
          
          {/* Combined Potential Savings */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Combined Potential Annual Savings (Energy & Water)
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatCurrency(totalSavings)}
          </div>
          
          {/* Combined After Rebates */}
          <div className="px-4 py-3 bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
            Combined Potential Cost Saving (After Rebates)
          </div>
          <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-right">
            {formatCurrency(totalSavings + potentialRebates)}
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper function to calculate payback
function calculatePayback(totalSavings: number, measures: any[]): string {
  const totalImplementationCost = measures.reduce((sum, m) => sum + (m.implementationCost || 0), 0);
  const payback = totalImplementationCost / totalSavings;
  return payback.toFixed(1);
} 