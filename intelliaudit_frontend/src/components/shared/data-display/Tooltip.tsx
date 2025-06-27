import React from 'react';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { cn } from '@/utils';

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  className,
  side = "top",
  align = "center",
  delayDuration = 300
}) => {
  return (
    <TooltipProvider>
      <ShadcnTooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side}
          align={align}
          className={cn("max-w-sm z-[9999]", className)}
          sideOffset={5}
        >
          {content}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
};
