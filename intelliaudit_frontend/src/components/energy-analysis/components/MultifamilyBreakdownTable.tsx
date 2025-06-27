import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface EndUseComponentDto {
  category: string;
  value: number;
  percentage: number;
  description?: string;
  color?: string;
  name?: string;
  electricPercent?: number;
  standardPercent?: number;
  deviationExplanation?: string;
}

interface MultifamilyBreakdownTableProps {
  components: EndUseComponentDto[];
}

export const MultifamilyBreakdownTable: React.FC<MultifamilyBreakdownTableProps> = ({ 
  components 
}) => {
  // Filter components that have standard percentages
  const componentsWithStandard = components.filter(c => c.standardPercent !== undefined);
  
  // Sort by largest deviation
  const sortedComponents = [...componentsWithStandard].sort((a, b) => {
    const aDeviation = Math.abs((a.electricPercent || 0) - (a.standardPercent || 0));
    const bDeviation = Math.abs((b.electricPercent || 0) - (b.standardPercent || 0));
    return bDeviation - aDeviation;
  });

  // Function to get badge color based on deviation
  const getDeviationBadge = (actual: number, standard: number) => {
    const deviation = Math.abs(actual - standard);
    
    if (deviation <= 3) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Standard</Badge>;
    } else if (deviation <= 10) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Moderate</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-100 text-red-800">Significant</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Multifamily Standard Comparison</CardTitle>
        <CardDescription>
          Comparison of actual energy breakdown to standard multifamily building patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold border border-border">End Use Component</TableHead>
                <TableHead className="text-center font-bold border border-border">Actual %</TableHead>
                <TableHead className="text-center font-bold border border-border">Standard %</TableHead>
                <TableHead className="text-center font-bold border border-border">Deviation</TableHead>
                <TableHead className="text-center font-bold border border-border">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedComponents.map((component, index) => {
                const actualPercent = component.electricPercent || 0;
                const standardPercent = component.standardPercent || 0;
                const deviation = actualPercent - standardPercent;
                
                return (
                  <TableRow key={component.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    <TableCell className="font-medium border border-border">{component.name}</TableCell>
                    <TableCell className="text-center border border-border">{actualPercent.toFixed(1)}%</TableCell>
                    <TableCell className="text-center border border-border">{standardPercent.toFixed(1)}%</TableCell>
                    <TableCell className="text-center border border-border">
                      {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center border border-border">
                      {getDeviationBadge(actualPercent, standardPercent)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Deviation Explanations</h3>
          {sortedComponents
            .filter(c => c.deviationExplanation)
            .map(component => (
              <div key={`explanation-${component.name}`} className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-semibold">{component.name}</h4>
                <p>{component.deviationExplanation}</p>
              </div>
            ))}
          
          {sortedComponents.filter(c => c.deviationExplanation).length === 0 && (
            <p className="text-muted-foreground italic">No significant deviations to explain.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
