import React from 'react';
import { GlowWrapper } from '@/components/ui/glow-wrapper';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

interface GlowingTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  caption?: string;
  glowIntensity?: "subtle" | "medium" | "strong";
  animated?: boolean;
}

/**
 * GlowingTable wraps the ShadCN Table with a green glowing effect
 */
export const GlowingTable: React.FC<GlowingTableProps> = ({
  children,
  caption,
  glowIntensity = "subtle",
  animated = true,
  ...props
}) => {
  return (
    <GlowWrapper 
      intensity={glowIntensity} 
      animated={animated}
      className="bg-card"
    >
      <Table {...props}>
        {caption && <TableCaption>{caption}</TableCaption>}
        {children}
      </Table>
    </GlowWrapper>
  );
};

// Re-export the table components for convenience
export {
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}; 