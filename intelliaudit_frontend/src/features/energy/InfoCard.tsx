import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  children: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  tooltipContent?: string; // Add optional tooltip content
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon: Icon,
  description,
  children,
  badge,
  tooltipContent
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-2 text-emerald-500" />
            {tooltipContent ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="hover:underline cursor-help">{title}</CardTitle>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltipContent}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <CardTitle>{title}</CardTitle>
            )}
          </div>
          {badge && (
            <Badge variant={badge.variant || 'default'}>
              {badge.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-muted-foreground mb-4">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
};