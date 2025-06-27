import React from 'react';
import pmLogo from '/assets/espm_logo.png';

interface Props { score?: number | null; }

export const EnergyStarCard: React.FC<Props> = ({ score }) => {
  if (score === undefined || score === null) return null;

  return (
    <div className="flex flex-col bg-card/50 border-2 border-gray-800 rounded-lg overflow-hidden text-center w-full max-w-xs">
      <div className="p-3 bg-gray-800 flex justify-center">
        <img src={pmLogo} alt="ENERGY STAR" className="h-6" />
      </div>
      <div className="p-6 text-6xl font-bold">{score}</div>
    </div>
  );
}; 