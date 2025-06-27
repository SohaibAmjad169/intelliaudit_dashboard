import { useMeasures, DetailedMeasure } from '@/hooks/useMeasures';

export function useMeasuresSummary(projectId: string | undefined) {
  const { eems, wems, rcms, isLoading, error } = useMeasures(projectId ?? '');

  const all = [...eems, ...wems, ...rcms];

  const topThree = [...all]
    .sort((a, b) => (b.estimatedSavings?.cost || 0) - (a.estimatedSavings?.cost || 0))
    .slice(0, 3)
    .map((m) => ({
      title: (m as any).title || (m as any).name || 'Measure',
      savings: Math.round(m.estimatedSavings?.cost || 0),
    }));

  const totals = all.reduce(
    (acc, m) => {
      const cost = m.detailedCost?.total ??
        (m.estimatedSavings?.cost && m.estimatedSavings?.paybackPeriod
          ? m.estimatedSavings.cost * m.estimatedSavings.paybackPeriod
          : 0);
      acc.totalCost += cost;
      acc.incentives += m.detailedCost?.incentives || 0;
      acc.annualSavings += m.estimatedSavings?.cost || 0;
      return acc;
    },
    { totalCost: 0, incentives: 0, annualSavings: 0 }
  );

  const payback = totals.annualSavings ? (totals.totalCost - totals.incentives) / totals.annualSavings : undefined;

  return {
    isLoading,
    error,
    topThree,
    summary: {
      totalCost: totals.totalCost,
      incentives: totals.incentives,
      annualSavings: totals.annualSavings,
      payback,
    },
  };
} 