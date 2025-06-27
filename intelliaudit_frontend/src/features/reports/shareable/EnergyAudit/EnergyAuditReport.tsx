import { EnergyEfficiencyMeasures } from './EnergyEfficiencyMeasures';
import { EnergyStarBenchmarking } from './EnergyStarBenchmarking';

interface EnergyAuditReportProps {
  projectId: string;
}

export function EnergyAuditReport({ projectId }: EnergyAuditReportProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-emerald-700 dark:text-emerald-500">
        Energy Audit Report
      </h1>
      
      {/* Executive Summary section would go here */}
      
      <div className="print:break-before-page">
        <EnergyStarBenchmarking projectId={projectId} />
      </div>
      
      <div className="print:break-before-page">
        <EnergyEfficiencyMeasures projectId={projectId} />
      </div>
    </div>
  );
}

export default EnergyAuditReport; 