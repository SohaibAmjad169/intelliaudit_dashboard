import { useEffect, useState } from 'react';
import { buildExecutiveSummary, ExecutiveSummaryData } from '../utils/buildExecutiveSummary';
import { useMeasures } from '@/hooks/useMeasures';

export function useExecutiveSummary(projectId?: string, project?: any) {
  const [data, setData] = useState<ExecutiveSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { eems, wems, rcms, isLoading: measuresLoading } = useMeasures(projectId ?? '');

  useEffect(() => {
    async function loadSummary() {
      if (!project || measuresLoading) return;
      
      try {
        const summaryData = await buildExecutiveSummary(project, { eems, wems, rcms });
        setData(summaryData);
      } catch (error) {
        console.error('Error building executive summary:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSummary();
  }, [project, eems, wems, rcms, measuresLoading]);

  return {
    data,
    isLoading: isLoading || measuresLoading
  };
} 