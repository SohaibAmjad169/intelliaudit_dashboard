import React from "react";

interface FinancialSummaryProps {
  totalCost?: number;
  incentives?: number;
  annualSavings?: number;
  payback?: string | number;
}

export const FinancialSummaryTable: React.FC<FinancialSummaryProps> = ({
  totalCost = 32233,
  incentives = 10929,
  annualSavings = 12297,
  payback = '1.7 years',
}) => {
  const rows = [
    { label: 'Total Project Cost', value: `$${totalCost.toLocaleString()}` },
    { label: 'Incentives', value: `$${incentives.toLocaleString()}` },
    { label: 'Net Cost After Incentives', value: `$${(totalCost - incentives).toLocaleString()}` },
    { label: 'Annual Savings', value: `$${annualSavings.toLocaleString()}` },
    { label: 'Payback', value: payback },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-border rounded-md overflow-hidden">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-4 py-2">Metric</th>
            <th className="px-4 py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <td className="px-4 py-2 whitespace-nowrap">{r.label}</td>
              <td className="px-4 py-2 whitespace-nowrap">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 