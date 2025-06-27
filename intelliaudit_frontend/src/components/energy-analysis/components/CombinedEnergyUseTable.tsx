import React, { useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Define interface for conversion factors
interface ConversionFactors {
  kWhTokBtu: number;
  thermsTokBtu: number;
}

interface CombinedEndUseData {
  name: string;
  kWh: number | null;
  therms: number | null;
}

interface BuildingData {
  grossFloorArea: number;
  floorAreaUnits: string;
}

interface CombinedEnergyUseTableProps {
  data: CombinedEndUseData[];
  conversionFactors: ConversionFactors;
  buildingData: BuildingData;
  historicalBilling: {
    kWh: number;
    therms: number;
  };
}

export const CombinedEnergyUseTable: React.FC<CombinedEnergyUseTableProps> = ({
  data,
  conversionFactors,
  buildingData,
  historicalBilling
}) => {
  const [sortColumn, setSortColumn] = React.useState<string>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Calculate kBtu and percentages for each end use
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    return data.map(item => {
      // Convert each energy source to kBtu
      const kBtuFromElectric = item.kWh !== null ? item.kWh * conversionFactors.kWhTokBtu : 0;
      const kBtuFromGas = item.therms !== null ? item.therms * conversionFactors.thermsTokBtu : 0;
      
      // Calculate total kBtu for this end use
      const totalkBtu = kBtuFromElectric + kBtuFromGas;
      
      return {
        ...item,
        kBtu: totalkBtu,
      };
    });
  }, [data, conversionFactors]);

  // Calculate total kBtu for all end uses
  const totalAllkBtu = useMemo(() => {
    if (!processedData || !Array.isArray(processedData)) {
      return 0;
    }
    return processedData.reduce((sum, item) => sum + item.kBtu, 0);
  }, [processedData]);

  // Calculate percentages
  const percentages = useMemo(() => {
    if (!processedData || !Array.isArray(processedData)) {
      return [];
    }
    return processedData.map(item => ({
      ...item,
      percentage: totalAllkBtu > 0 ? (item.kBtu / totalAllkBtu) * 100 : 0
    }));
  }, [processedData, totalAllkBtu]);

  // Calculate building energy use intensity (EUI)
  const eui = useMemo(() => {
    if (!buildingData || !buildingData.grossFloorArea || !Array.isArray(percentages)) {
      return 0;
    }
    const totalkBtu = percentages.reduce((sum, item) => sum + item.kBtu, 0);
    return buildingData.grossFloorArea > 0 ? totalkBtu / buildingData.grossFloorArea : 0;
  }, [buildingData, percentages]);

  // Sort the data
  const sortedData = useMemo(() => {
    if (!percentages || !Array.isArray(percentages)) {
      return [];
    }
    return [...percentages].sort((a, b) => {
      let comparison = 0;
      
      if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === 'kWh') {
        comparison = (a.kWh || 0) - (b.kWh || 0);
      } else if (sortColumn === 'therms') {
        comparison = (a.therms || 0) - (b.therms || 0);
      } else if (sortColumn === 'kBtu') {
        comparison = a.kBtu - b.kBtu;
      } else if (sortColumn === 'percentage') {
        comparison = a.percentage - b.percentage;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [percentages, sortColumn, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!data || !Array.isArray(data) || !percentages || !Array.isArray(percentages)) {
      return {
        kWh: 0,
        therms: 0,
        kBtu: 0,
      };
    }
    return {
      kWh: data.reduce((sum, item) => sum + (item.kWh || 0), 0),
      therms: data.reduce((sum, item) => sum + (item.therms || 0), 0),
      kBtu: percentages.reduce((sum, item) => sum + item.kBtu, 0),
    };
  }, [data, percentages]);

  // Get background color intensity based on percentage
  const getBackgroundColor = (percent: number) => {
    if (percent <= 0) return '';
    const intensity = Math.min(Math.max(percent / 30, 0.1), 0.5);
    return `rgba(34, 197, 94, ${intensity})`; // Green with variable intensity
  };

  return (
    <div className="space-y-6">
      {/* Conversion Factors Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Conversion Factor to kBtu</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="border-collapse">
            <TableBody>
              <TableRow>
                <TableCell className="font-medium border border-border">Input Unit 1</TableCell>
                <TableCell className="font-medium border border-border">kWh</TableCell>
                <TableCell className="text-right border border-border">{conversionFactors.kWhTokBtu}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium border border-border">Input Unit 2</TableCell>
                <TableCell className="font-medium border border-border">therms</TableCell>
                <TableCell className="text-right border border-border">{conversionFactors.thermsTokBtu}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium border border-border">Combined Output Units</TableCell>
                <TableCell className="font-medium border border-border">kBtu</TableCell>
                <TableCell className="text-right border border-border">1</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium border border-border">Building Gross Floor Area</TableCell>
                <TableCell className="font-medium border border-border" colSpan={2}>
                  {buildingData.grossFloorArea.toLocaleString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium border border-border">Floor Area Units</TableCell>
                <TableCell className="font-medium border border-border" colSpan={2}>
                  {buildingData.floorAreaUnits}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Combined Energy Use Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">End-Use Breakdown Estimation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead rowSpan={2} className="font-bold border border-border w-[150px]">
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-bold"
                      onClick={() => handleSort('name')}
                    >
                      End Use
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead colSpan={2} className="text-center font-bold border border-border">
                    Input Energy Units
                  </TableHead>
                  <TableHead colSpan={2} className="text-center font-bold border border-border">
                    Combined Energy Use
                  </TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center font-bold border border-border w-[100px]">
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-bold"
                      onClick={() => handleSort('kWh')}
                    >
                      kWh
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center font-bold border border-border w-[100px]">
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-bold"
                      onClick={() => handleSort('therms')}
                    >
                      therms
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center font-bold border border-border w-[100px]">
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-bold"
                      onClick={() => handleSort('kBtu')}
                    >
                      kBtu
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center font-bold border border-border w-[80px]">
                    <Button
                      variant="ghost"
                      className="p-0 h-auto font-bold"
                      onClick={() => handleSort('percentage')}
                    >
                      %
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow key={item.name} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    <TableCell className="font-medium border border-border">{item.name}</TableCell>
                    <TableCell className="text-right border border-border">
                      {item.kWh !== null ? item.kWh.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right border border-border">
                      {item.therms !== null ? item.therms.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell 
                      className="text-right border border-border font-medium"
                      style={{ 
                        backgroundColor: getBackgroundColor(item.percentage) 
                      }}
                    >
                      {Math.round(item.kBtu).toLocaleString()}
                    </TableCell>
                    <TableCell 
                      className="text-center border border-border font-bold"
                      style={{ 
                        backgroundColor: getBackgroundColor(item.percentage) 
                      }}
                    >
                      {Math.round(item.percentage)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/70 font-bold">
                  <TableCell className="border border-border">Total Estimated</TableCell>
                  <TableCell className="text-right border border-border">{totals.kWh.toLocaleString()}</TableCell>
                  <TableCell className="text-right border border-border">{totals.therms.toLocaleString()}</TableCell>
                  <TableCell className="text-right border border-border">{Math.round(totals.kBtu).toLocaleString()}</TableCell>
                  <TableCell className="text-center border border-border">100%</TableCell>
                </TableRow>
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell className="border border-border">Historical Billing</TableCell>
                  <TableCell className="text-right border border-border">{historicalBilling.kWh.toLocaleString()}</TableCell>
                  <TableCell className="text-right border border-border">{historicalBilling.therms.toLocaleString()}</TableCell>
                  <TableCell className="text-right border border-border" colSpan={2}>
                    {Math.round(totals.kBtu).toLocaleString()}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell className="border border-border">Percent of Actual</TableCell>
                  <TableCell className="text-center border border-border" colSpan={2}></TableCell>
                  <TableCell className="text-center border border-border" colSpan={2}>100%</TableCell>
                </TableRow>
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell className="border border-border">Total per {buildingData.floorAreaUnits}</TableCell>
                  <TableCell className="text-right border border-border" colSpan={2}>
                    {(totals.kWh / buildingData.grossFloorArea).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right border border-border" colSpan={2}>
                    {eui.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 