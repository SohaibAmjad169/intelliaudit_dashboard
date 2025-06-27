import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

// Define utility rates as constants (matching the rates in EnhancedEnergyBreakdownTable)
const ELECTRIC_RATE = 0.15; // $0.15 per kWh
const GAS_RATE = 1.50; // $1.50 per therm

interface EndUseItem {
  name: string;
  kWh: number | null;
  therms: number | null;
}

interface EndUseByTypeTableProps {
  data?: EndUseItem[];
  title: string;
  description?: string;
}

export function EndUseByTypeTable({ data, title, description }: EndUseByTypeTableProps) {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  // Default to 0 if undefined or NaN
  const totalTherms = safeData
    .reduce((acc, item) => acc + (item.therms || 0), 0);
  
  const totalKwh = safeData
    .reduce((acc, item) => acc + (item.kWh || 0), 0);
  
  // Calculate total costs
  const totalElectricCost = totalKwh * ELECTRIC_RATE;
  const totalGasCost = totalTherms * GAS_RATE;
  
  // Get unique types, ensure using safeData
  const types = [...new Set(safeData.map((item) => item.name))];

  return (
    <Card className="col-span-12 w-full">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>End Use</TableHead>
              <TableHead className="text-right">kWh</TableHead>
              <TableHead className="text-right">Annual Electric Cost</TableHead>
              <TableHead className="text-right">Therms</TableHead>
              <TableHead className="text-right">Annual Gas Cost</TableHead>
              <TableHead className="text-right">Total Annual Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => {
              // Filter by type using safeData
              const itemsOfType = safeData.filter((item) => item.name === type);
              
              // Empty rows for items without therms/kwh
              if (itemsOfType.length === 0) return null;
              
              // Sum values for this type
              const kwh = itemsOfType.reduce((acc, item) => acc + (item.kWh || 0), 0);
              const therms = itemsOfType.reduce((acc, item) => acc + (item.therms || 0), 0);
              
              // Calculate costs
              const electricCost = kwh * ELECTRIC_RATE;
              const gasCost = therms * GAS_RATE;
              const totalCost = electricCost + gasCost;
              
              return (
                <TableRow key={type}>
                  <TableCell className="font-medium">{type}</TableCell>
                  <TableCell className="text-right">{kwh.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${electricCost.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{therms.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${gasCost.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${totalCost.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{totalKwh.toLocaleString()}</TableCell>
              <TableCell className="text-right">${totalElectricCost.toLocaleString()}</TableCell>
              <TableCell className="text-right">{totalTherms.toLocaleString()}</TableCell>
              <TableCell className="text-right">${totalGasCost.toLocaleString()}</TableCell>
              <TableCell className="text-right">${(totalElectricCost + totalGasCost).toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Cost calculations are based on rates of ${ELECTRIC_RATE.toFixed(2)}/kWh for electricity and ${GAS_RATE.toFixed(2)}/therm for gas.</p>
        </div>
      </CardContent>
    </Card>
  );
} 