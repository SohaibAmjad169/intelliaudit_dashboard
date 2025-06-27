import { ReportData, EcoData } from './types';

interface ExecutiveSummaryProps {
  reportData: ReportData;
  ecoData: EcoData;
}

export function ExecutiveSummary({ reportData, ecoData }: ExecutiveSummaryProps) {
  const project = reportData.project;
  
  // Extract data to fill in placeholders using available properties
  const clientName = project?.company_name || project?.property_name || 'Client';
  const buildingAddress = project?.property_address || project?.building_address || 'Property Address';
  const constructionYear = project?.property_year_built || project?.year_built || 'N/A';
  const buildingType = project?.building_type || project?.building_use_type || 'commercial';
  const buildingDescription = project?.description || `${buildingType} building`;
  const squareFootage = project?.property_gross_floor_area || project?.square_footage || project?.building_sqft || 0;
  
  // Extract any secondary area data if available from building_info
  const secondaryAreaType = project?.building_info?.type ? `${project.building_info.type} common` : 'common';
  const secondaryAreaSqft = Math.round(squareFootage * 0.1); // Estimate as 10% of total
  
  // Extract unit information if available
  const unitCountType1 = project?.total_units || (project?.building_info?.total_units || 0);
  const unitType1 = project?.building_info?.unit_types?.[0]?.type || 'residential';
  const unitCountType2 = project?.building_info?.unit_types?.[1]?.count || 0;
  const unitType2 = project?.building_info?.unit_types?.[1]?.type || 'commercial';
  
  // Create executive summary from ecoData or placeholder
  const executiveSummaryContent = ecoData.summary || 
    `This report presents the findings of an ASHRAE Level II Energy Audit, Water Audit, and Retro-commissioning (RCx) study conducted at ${buildingAddress}. The analysis identified potential annual savings of $${formatCurrency(reportData.totalCost.total * 0.2)} through the implementation of energy and water efficiency measures. The property currently has an annual energy consumption of ${formatNumber(reportData.totalUsage.total)} kWh and water consumption of ${formatNumber(reportData.totalUsage.water)} gallons. The recommended measures include ${ecoData.recommendations.slice(0, 3).map(r => r.title || r.description).join(', ')}.`;
  
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-4 text-emerald-700 dark:text-emerald-500">Building Energy and Water Efficiency Report</h2>
      
      <div className="prose max-w-none dark:prose-invert">
        <h3 className="text-xl font-semibold mb-3">1. Executive Summary</h3>
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p>{executiveSummaryContent}</p>
        </div>
        
        <h3 className="text-xl font-semibold mb-3">2. Introduction</h3>
        <p>
          At the request of {clientName}, Vert Energy Group (VEG) performed ASHRAE Level II Energy Audit, Water Audit and a retro-commissioning (RCx) study of the base building systems at {buildingAddress}. Built in {constructionYear}, this building is comprised of {buildingType}. The {buildingType} portion of this property has a gross floor area of {formatNumber(squareFootage)} ft². 
          {unitCountType1 > 0 && unitCountType2 > 0 ? 
            ` It has a total of ${unitCountType1} ${unitType1} and ${unitCountType2} ${unitType2} apartments.` : 
            unitCountType1 > 0 ? ` It has a total of ${unitCountType1} ${unitType1} units.` : ''}
        </p>
        
        <p className="mt-4">
          The study is referred to as The Existing Buildings Energy and Water Efficiency (EBEWE) Program, was established by Los Angeles Municipal Code (LAMC) Division 97, Article 1, Chapter IX with the purpose of reducing energy and water consumption by building in the City of Los Angeles. The efficiency improvements (if implemented) will lower the use of energy, water, and greenhouse gas emissions citywide.
        </p>
        
        <h4 className="text-lg font-semibold mt-6 mb-2">The Energy Efficiency Audit Scope of Work includes:</h4>
        <ol className="list-decimal list-outside ml-6">
          <li>Perform an on-site facility survey of existing mechanical, electrical, lighting, and control systems, and interview the critical operations and maintenance personnel.</li>
          <li>Summarize observations, existing conditions, necessities, and opportunities.</li>
          <li>Analyze energy use and ENERGY STAR® benchmarking.</li>
          <li>Identify and summarize Energy Efficiency Measures (EEMs) based on a 10-year ownership strategy.</li>
          <li>Prepare an Energy Management Plan to achieve the following objectives.
            <ul className="list-disc list-outside ml-6 mt-2">
              <li>Reduce energy usage and cost through equipment and control upgrades</li>
              <li>Improve energy performance.</li>
              <li>Reduce water usage and cost through equipment and control upgrades</li>
              <li>Reduce water usage and cost thru operation and maintenance</li>
            </ul>
          </li>
        </ol>
        
        <h4 className="text-lg font-semibold mt-6 mb-2">The Water Audit Scope of Work includes:</h4>
        <ol className="list-decimal list-outside ml-6">
          <li>Perform an on-site facility survey of existing water-using fixtures, equipment, systems, and processes, and interview the critical operations and maintenance personnel.</li>
          <li>Summarize observations, existing conditions, necessities, and opportunities.</li>
          <li>Analyze water use and water use intensity (WUI).</li>
          <li>Identify and summarize Water Efficiency Measures (WEMs) based on a 10-year ownership strategy.</li>
          <li>Prepare a Management Plan to achieve the following objectives.
            <ul className="list-disc list-outside ml-6 mt-2">
              <li>Reduce water usage and cost through equipment and control upgrades.</li>
              <li>Reduce water usage and cost through monitoring & repairs</li>
              <li>Reduce water usage and cost thru operation and maintenance</li>
            </ul>
          </li>
        </ol>
        
        <h4 className="text-lg font-semibold mt-6 mb-2">The Retro-commissioning (RCx) study Scope of Work included:</h4>
        <ol className="list-decimal list-outside ml-6">
          <li>Perform an on-site facility survey of existing mechanical, electrical, lighting, and control systems, and interview the critical operations and maintenance personnel.</li>
          <li>Summarize observations, necessities, and opportunities.</li>
          <li>Identify and summarize Retro-commissioning Measures (RCMs) to be implemented.</li>
          <li>Prepare a Retro-commissioning Plan to achieve the following objectives.
            <ul className="list-disc list-outside ml-6 mt-2">
              <li>Correct existing equipment and system problems and deficiencies</li>
              <li>Optimize the building systems via tune-up activities</li>
              <li>Improve operation and maintenance (O&M)</li>
              <li>Reduce maintenance costs and improve long-term equipment reliability</li>
            </ul>
          </li>
        </ol>
      </div>
    </section>
  );
}

// Helper functions for formatting
function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(Math.round(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat().format(Math.round(value));
} 