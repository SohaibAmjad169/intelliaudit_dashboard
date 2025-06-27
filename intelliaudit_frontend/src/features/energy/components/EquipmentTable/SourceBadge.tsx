import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

interface SourceBadgeProps {
  source: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, className }) => {
  const getStyle = () => {
    switch (source.toLowerCase()) {
      case 'database':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'field_notes':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'photo_analysis':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getLabel = () => {
    switch (source.toLowerCase()) {
      case 'database':
        return 'Database';
      case 'field_notes':
        return 'Field Notes';
      case 'photo_analysis':
        return 'AI Analyzed';
      default:
        return source;
    }
  };

  return (
    <Badge variant="outline" className={cn(getStyle(), 'text-xs', className)}>
      {getLabel()}
    </Badge>
  );
}; 