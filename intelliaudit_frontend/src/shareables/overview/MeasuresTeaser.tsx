import React from "react";

interface Measure {
  title: string;
  savings: number; // annual $ savings
}

interface MeasuresTeaserProps {
  measures?: Measure[];
}

export const MeasuresTeaser: React.FC<MeasuresTeaserProps> = ({ measures = [] }) => {
  const data = measures.length
    ? measures
    : [
        { title: 'Retro-commission HVAC systems', savings: 68000 },
        { title: 'LED + AHU upgrades', savings: 24000 },
        { title: 'Pipe insulation', savings: 9500 },
      ];

  return (
    <div className="flex flex-wrap gap-2">
      {data.map((m) => (
        <span
          key={m.title}
          className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium"
        >
          {m.title} • ${m.savings.toLocaleString()}/yr
        </span>
      ))}
    </div>
  );
}; 