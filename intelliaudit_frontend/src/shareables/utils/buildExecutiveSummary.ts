import { useMeasures } from '@/hooks/useMeasures';

export interface ExecutiveSummaryData {
  introParagraph: string;
  scopes: {
    energy: string[];
    water: string[];
    rcx: string[];
  };
  financialTotals: {
    simplePayback: number;
    npv: number;
    roi: number;
    irr: number;
    mirr: number;
  };
}

export function buildIntroText(
  clientName: string,
  buildingAddress: string,
  constructionYear: string | number,
  buildingType: string,
  squareFootage: number
): string {
  return `At the request of ${clientName}, Vert Energy Group (VEG) performed ASHRAE Level II Energy Audit, Water Audit and a retro-commissioning (RCx) study of the base building systems at ${buildingAddress}. Built in ${constructionYear}, this building is comprised of ${buildingType}. The ${buildingType} portion of this property has a gross floor area of ${squareFootage.toLocaleString()} ft².

The study is referred to as The Existing Buildings Energy and Water Efficiency (EBEWE) Program, was established by Los Angeles Municipal Code (LAMC) Division 97, Article 1, Chapter IX with the purpose of reducing energy and water consumption by building in the City of Los Angeles. The efficiency improvements (if implemented) will lower the use of energy, water, and greenhouse gas emissions citywide.`;
}

export const SCOPE_DEFINITIONS = {
  energy: [
    "Perform an on-site facility survey of existing mechanical, electrical, lighting, and control systems, and interview the critical operations and maintenance personnel.",
    "Summarize observations, existing conditions, necessities, and opportunities.",
    "Analyze energy use and ENERGY STAR® benchmarking.",
    "Identify and summarize Energy Efficiency Measures (EEMs) based on a 10-year ownership strategy.",
    "Prepare an Energy Management Plan to achieve the following objectives:"
  ],
  water: [
    "Perform an on-site facility survey of existing water-using fixtures, equipment, systems, and processes, and interview the critical operations and maintenance personnel.",
    "Summarize observations, existing conditions, necessities, and opportunities.",
    "Analyze water use and water use intensity (WUI).",
    "Identify and summarize Water Efficiency Measures (WEMs) based on a 10-year ownership strategy.",
    "Prepare a Management Plan to achieve the following objectives."
  ],
  rcx: [
    "Perform an on-site facility survey of existing mechanical, electrical, lighting, and control systems, and interview the critical operations and maintenance personnel.",
    "Summarize observations, necessities, and opportunities.",
    "Identify and summarize Retro-commissioning Measures (RCMs) to be implemented.",
    "Prepare a Retro-commissioning Plan to achieve the following objectives."
  ]
};

export function calculateFinancialTotals(eems: any[], wems: any[], rcms: any[]) {
  const allMeasures = [...eems, ...wems, ...rcms];
  
  if (allMeasures.length === 0) {
    return {
      simplePayback: 0,
      npv: 0,
      roi: 0,
      irr: 0,
      mirr: 0
    };
  }

  // Calculate averages and totals
  const getSimplePayback = (measure: any) => measure.estimatedSavings?.paybackPeriod || 0;
  const getROI = (measure: any) => {
    if ((measure.estimatedSavings as any)?.roi !== undefined) {
      return (measure.estimatedSavings as any).roi;
    }
    const cost = measure.detailedCost?.total || 
      (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod
        ? measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod
        : 0);
    if (cost === 0) return 0;
    const annualSavings = measure.estimatedSavings?.cost || 0;
    return (annualSavings / cost) * 100;
  };

  const getNPV = (measure: any) => {
    if ((measure.estimatedSavings as any)?.npv !== undefined) {
      return (measure.estimatedSavings as any).npv;
    }
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const usefulLife = 15; // Default life
    const cost = measure.detailedCost?.total || 
      (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod
        ? measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod
        : 0);
    return annualSavings * usefulLife - cost;
  };

  const getIRR = (measure: any) => {
    if ((measure.estimatedSavings as any)?.irr !== undefined) {
      return (measure.estimatedSavings as any).irr;
    }
    const annualSavings = measure.estimatedSavings?.cost || 0;
    const cost = measure.detailedCost?.total || 
      (measure.estimatedSavings?.cost && measure.estimatedSavings?.paybackPeriod
        ? measure.estimatedSavings.cost * measure.estimatedSavings.paybackPeriod
        : 0);
    if (cost === 0) return 0;
    return (annualSavings / cost) * 100;
  };

  const getMIRR = (measure: any) => {
    const irr = getIRR(measure);
    return irr * 0.6; // Simple estimation
  };

  return {
    simplePayback: allMeasures.reduce((sum, m) => sum + getSimplePayback(m), 0) / allMeasures.length,
    npv: allMeasures.reduce((sum, m) => sum + getNPV(m), 0),
    roi: allMeasures.reduce((sum, m) => sum + getROI(m), 0) / allMeasures.length,
    irr: allMeasures.reduce((sum, m) => sum + getIRR(m), 0) / allMeasures.length,
    mirr: allMeasures.reduce((sum, m) => sum + getMIRR(m), 0) / allMeasures.length
  };
}

export function buildExecutiveSummary(project: any, measures: { eems: any[]; wems: any[]; rcms: any[] }): ExecutiveSummaryData {
  // Build introductory paragraph using available project data. Fallbacks ensure the function never throws due to missing fields.
  const introParagraph = buildIntroText(
    project?.client_name || project?.name || 'Client',
    project?.property_street || project?.property_address || 'the property',
    project?.property_year_built || '—',
    project?.property_primary_function || project?.building_type || 'building',
    Number(project?.property_gross_floor_area) || 0,
  );

  // Re-use static scope definitions defined above.
  const scopes = {
    energy: SCOPE_DEFINITIONS.energy,
    water: SCOPE_DEFINITIONS.water,
    rcx: SCOPE_DEFINITIONS.rcx,
  };

  // Calculate aggregate financial metrics for all measures.
  const { eems = [], wems = [], rcms = [] } = measures || {};
  const financialTotals = calculateFinancialTotals(eems, wems, rcms);

  return {
    introParagraph,
    scopes,
    financialTotals,
  };
} 