import React from 'react';
import { KwhEndUseChart } from './KwhEndUseChart';
import { ThermsEndUseChart } from './ThermsEndUseChart';
import { CombinedKbtuEndUseChart } from './CombinedKbtuEndUseChart';
import { CombinedEndUseData, ConversionFactors } from '../types/energyAnalysis.types';

interface EnergyPieChartDashboardProps {
  data: CombinedEndUseData[];
  conversionFactors?: ConversionFactors;
}

// Default conversion factors (standard values)
const DEFAULT_CONVERSION_FACTORS: ConversionFactors = {
  kWhTokBtu: 3.412,
  thermsTokBtu: 100
};

export const EnergyPieChartDashboard: React.FC<EnergyPieChartDashboardProps> = ({ 
  data, 
  conversionFactors = DEFAULT_CONVERSION_FACTORS
}) => {
  return (
    <div className="flex flex-col gap-8 overflow-y-auto">
      <div className="w-full">
        <KwhEndUseChart data={data} />
      </div>
      <div className="w-full">
        <ThermsEndUseChart data={data} />
      </div>
      <div className="w-full">
        <CombinedKbtuEndUseChart data={data} />
      </div>
    </div>
  );
}; 