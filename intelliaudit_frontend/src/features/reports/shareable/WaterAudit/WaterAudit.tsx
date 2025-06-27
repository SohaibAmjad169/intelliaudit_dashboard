import { useState } from 'react';
import { WaterAuditReport } from './WaterAuditReport';
import { WEMsCostSavingsTable } from './WEMsCostSavingsTable';
import { WaterExistingConditions } from './WaterExistingConditions';
import { WaterEfficiencyMeasures } from './WaterEfficiencyMeasures';

interface WaterAuditProps {
  projectId: string;
}

export function WaterAudit({ projectId }: WaterAuditProps) {
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<string | null>(null);

  if (!projectId) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
        <p className="text-yellow-700 dark:text-yellow-500 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          No project ID provided. Cannot load water audit report.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <div className="text-center py-6">Loading water audit report...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-center py-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="water-audit-container">
      {/* Section A: Introduction */}
      <WaterAuditReport />

      {/* Section C: Existing Conditions */}
      <WaterExistingConditions projectId={projectId} />

      {/* Section D: Water Efficiency Measures Cost Savings Table */}
      <WEMsCostSavingsTable projectId={projectId} />

      {/* Section E: Water Efficiency Measures Detailed */}
      <WaterEfficiencyMeasures projectId={projectId} />
    </div>
  );
}

export default WaterAudit; 