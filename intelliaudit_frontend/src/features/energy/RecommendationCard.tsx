import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ECOMeasure } from '@/types/eco';
import { Lightbulb } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: ECOMeasure;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  return (
    <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
          {recommendation.icon || <Lightbulb className="w-4 h-4" />}
        </div>
        <h4 className="font-medium">{recommendation.title || 'Recommendation'}</h4>
        {recommendation.priority && (
          <Badge className={getPriorityColor(recommendation.priority)}>
            {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)}
          </Badge>
        )}
      </div>
      {recommendation.description && (
        <p className="text-sm text-muted-foreground">{recommendation.description}</p>
      )}
      {!recommendation.description && (
        <p className="text-sm text-muted-foreground">No description available</p>
      )}
      {recommendation.estimatedSavings && (
        <div className="mt-2 text-sm">
          <span className="font-medium">Estimated Savings: </span>
          <span className="text-emerald-600 dark:text-emerald-400">{recommendation.estimatedSavings}</span>
        </div>
      )}
    </div>
  );
}; 