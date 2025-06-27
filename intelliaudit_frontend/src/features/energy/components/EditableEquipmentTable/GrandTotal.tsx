import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';

interface GrandTotalProps {
  totalKwh: number;
}

export const GrandTotal: React.FC<GrandTotalProps> = ({ totalKwh }) => {
  return (
    <TableRow className="bg-zinc-800/50 border-t-2 border-zinc-600">
      <TableCell colSpan={5} className="text-right font-medium text-lg">
        Grand Total:
      </TableCell>
      <TableCell className="font-bold text-yellow-400 text-lg">
        {totalKwh.toLocaleString()} kWh
      </TableCell>
      <TableCell colSpan={3}></TableCell>
    </TableRow>
  );
};
