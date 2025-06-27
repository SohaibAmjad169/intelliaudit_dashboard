import React from 'react';
import { Droplet } from 'lucide-react';

interface Props { score?: number | null; }

export const WaterScoreCard: React.FC<Props> = ({ score }) => {
  if (score === undefined || score === null) return null;

  return (
    <div className="flex flex-col bg-card/50 border-2 border-blue-600 rounded-lg overflow-hidden text-center w-full max-w-xs">
      <div className="p-3 bg-blue-600 flex justify-center">
        <Droplet className="h-6 w-6 text-white" />
      </div>
      <div className="p-6 text-6xl font-bold text-blue-600 dark:text-blue-400">{score}</div>
    </div>
  );
}; 