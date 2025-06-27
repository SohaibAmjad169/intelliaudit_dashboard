import React from 'react';
import pmLogo from '/assets/espm_logo.png';
import { Droplet, ExternalLink, HelpCircle } from 'lucide-react';

interface Props {
  energyStar?: number | null;
  waterScore?: number | null;
}

export const PortfolioScoresCard: React.FC<Props> = ({ energyStar, waterScore }) => {
  if (energyStar == null && waterScore == null) return null;

  return (
    <div className="bg-card/50 border border-border rounded-lg w-full max-w-md overflow-hidden">
      {/* Logo */}
      <div className="flex justify-center py-3 bg-gray-800">
        <img src={pmLogo} alt="Portfolio Manager" className="h-6" />
      </div>

      <div className="grid grid-cols-2 divide-x divide-border text-center">
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
            {/* Star icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            Benchmark
          </div>
          <div className="text-4xl font-bold">{energyStar ?? '--'}</div>
          <div className="text-xs italic text-muted-foreground mt-0.5">ENERGY STAR benchmark score</div>
        </div>
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
            <Droplet className="h-3 w-3" /> Water
          </div>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{waterScore ?? '--'}</div>
          <div className="text-xs italic text-muted-foreground mt-0.5">Portfolio Manager water score</div>
        </div>
      </div>

      {/* Helpful Links */}
      <div className="border-t border-border px-4 py-3 space-y-2">
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
          <HelpCircle className="h-3 w-3" />
          Helpful Links
        </div>
        
        {/* Portfolio Manager Link */}
        <a 
          href="https://www.energystar.gov/buildings/benchmark" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
        >
          <ExternalLink className="h-3 w-3" />
          EPA Portfolio Manager Benchmarking
        </a>

        {/* EBEWE FAQs Link */}
        <a 
          href="https://www.ladbs.org/docs/default-source/forms/ebewe/ebewe-arcx-faqs-final-030223.pdf?sfvrsn=d4f3c053_12" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
        >
          <ExternalLink className="h-3 w-3" />
          EBEWE Audits & Retro-Commissioning FAQs
        </a>
      </div>
    </div>
  );
}; 