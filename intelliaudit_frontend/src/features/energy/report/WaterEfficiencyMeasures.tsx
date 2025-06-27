import React from 'react';
import { Droplet, Bath, Waves, Sprout } from 'lucide-react';
// These imports are kept for future implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Icons will be used in future implementation
// import { TrendingDown, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WaterMeasure {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  annualSavings?: {
    gallons?: number;
    cost?: number;
  };
  implementationCost?: number;
  paybackPeriod?: number;
  priority?: 'high' | 'medium' | 'low';
  complexity?: 'simple' | 'moderate' | 'complex';
  details?: string;
}

interface WaterEfficiencyMeasuresProps {
  measures?: WaterMeasure[];
  formatNumber: (value?: number) => string;
  formatCurrency: (value?: number) => string;
  formatPercent?: (value?: number) => string;
  // Property that is received but not currently used in the component
  // Using underscore prefix to indicate it is intentionally unused
  _equipment?: any[];
}

export const WaterEfficiencyMeasures: React.FC<WaterEfficiencyMeasuresProps> = ({
  measures = [],
  // This parameter is received for future implementation
  // @ts-ignore -- Intentionally unused property for future implementation
  _equipment = [],
  formatNumber,
  formatCurrency,
  formatPercent = (value?: number) => value ? `${value.toFixed(1)}%` : 'N/A',
}) => {
  // Group measures by category
  const measuresByCategory: Record<string, WaterMeasure[]> = {};
  measures.forEach(measure => {
    const category = measure.category || 'General';
    if (!measuresByCategory[category]) {
      measuresByCategory[category] = [];
    }
    measuresByCategory[category].push(measure);
  });
  
  // Sort categories by total savings potential
  const sortedCategories = Object.keys(measuresByCategory).sort((a, b) => {
    const aSavings = measuresByCategory[a].reduce((sum, measure) => 
      sum + (measure.annualSavings?.cost || 0), 0);
    const bSavings = measuresByCategory[b].reduce((sum, measure) => 
      sum + (measure.annualSavings?.cost || 0), 0);
    return bSavings - aSavings;
  });
  
  // Get icon for each category
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('irrigation') || lowerCategory.includes('outdoor')) {
      return <Sprout className="h-5 w-5 mr-2" />;
    } else if (lowerCategory.includes('fixture') || lowerCategory.includes('faucet') || lowerCategory.includes('toilet')) {
      return <Bath className="h-5 w-5 mr-2" />;
    } else if (lowerCategory.includes('cooling') || lowerCategory.includes('boiler')) {
      return <Waves className="h-5 w-5 mr-2" />;
    } else {
      return <Droplet className="h-5 w-5 mr-2" />;
    }
  };
  
  // Get color for priority
  const getPriorityColor = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium':
        return 'text-cyan-600 bg-cyan-50 border-cyan-200';
      case 'low':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Calculate totals
  const totalGallonsSavings = measures.reduce((sum, measure) => 
    sum + (measure.annualSavings?.gallons || 0), 0);
  const totalCostSavings = measures.reduce((sum, measure) => 
    sum + (measure.annualSavings?.cost || 0), 0);
  const totalImplementationCost = measures.reduce((sum, measure) => 
    sum + (measure.implementationCost || 0), 0);
  const averagePayback = totalCostSavings > 0 
    ? totalImplementationCost / totalCostSavings 
    : 0;
  
  return (
    <div className="print:page-break-after">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Droplet className="h-6 w-6 mr-2" />
        Water Efficiency Measures
      </h3>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          The following water efficiency measures were identified based on the site assessment, water bill analysis, 
          and building systems evaluation. Each measure is analyzed for water savings, cost reduction, implementation cost, 
          and return on investment.
        </p>
      </div>
      
      {measures.length > 0 ? (
        <>
          {/* Summary of Measures */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Summary of Water Measures</h4>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Measure</TableHead>
                      <TableHead>Annual Water Savings</TableHead>
                      <TableHead>Annual Cost Savings</TableHead>
                      <TableHead>Implementation Cost</TableHead>
                      <TableHead className="text-right">Payback (years)</TableHead>
                      <TableHead className="text-right">Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measures.map((measure, index) => (
                      <TableRow key={measure.id || `measure-${index}`}>
                        <TableCell className="font-medium">{measure.name}</TableCell>
                        <TableCell>
                          {(measure.annualSavings?.gallons ?? 0) > 0 && (
                            <div>{formatNumber(measure.annualSavings?.gallons)} gallons</div>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(measure.annualSavings?.cost)}</TableCell>
                        <TableCell>{formatCurrency(measure.implementationCost)}</TableCell>
                        <TableCell className="text-right">
                          {typeof measure.paybackPeriod === 'number' ? measure.paybackPeriod.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(measure.priority)}`}
                          >
                            {(measure.priority || 'MEDIUM').toUpperCase()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Total Row */}
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>TOTAL</TableCell>
                      <TableCell>
                        <div>
                          {formatNumber(totalGallonsSavings)} gallons
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(totalCostSavings)}</TableCell>
                      <TableCell>{formatCurrency(totalImplementationCost)}</TableCell>
                      <TableCell className="text-right">
                        {averagePayback > 0 ? averagePayback.toFixed(1) : 'N/A'}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Measures by Category */}
          {sortedCategories.map((category) => (
            <div key={category} className="mb-8">
              <h4 className="text-lg font-medium mb-4 flex items-center">
                {getCategoryIcon(category)}
                {category}
              </h4>
              
              <div className="space-y-6">
                {measuresByCategory[category].map((measure, index) => (
                  <Card key={measure.id || `measure-detail-${index}`} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 py-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{measure.name}</CardTitle>
                        <span 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(measure.priority)} border`}
                        >
                          {(measure.priority || 'MEDIUM').toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="mb-4">{measure.description || 'No description available.'}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-muted/30 p-3 rounded-md">
                          <h6 className="text-sm font-medium mb-1">Annual Water Savings</h6>
                          <div className="space-y-1">
                            {(measure.annualSavings?.gallons ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">Water Usage:</span>
                                <span className="font-medium">{formatNumber(measure.annualSavings?.gallons)} gallons</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground text-sm">Potential Reduction:</span>
                              <span className="font-medium">
                                {(totalGallonsSavings > 0) 
                                  ? formatPercent((measure.annualSavings?.gallons || 0) / totalGallonsSavings * 100)
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 p-3 rounded-md">
                          <h6 className="text-sm font-medium mb-1">Financial Analysis</h6>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Annual Cost Savings:</span>
                              <span className="font-medium">{formatCurrency(measure.annualSavings?.cost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Implementation Cost:</span>
                              <span className="font-medium">{formatCurrency(measure.implementationCost)}</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground text-sm">Simple Payback:</span>
                              <span className="font-medium">
                                {typeof measure.paybackPeriod === 'number' ? `${measure.paybackPeriod.toFixed(1)} years` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-muted/30 p-3 rounded-md">
                          <h6 className="text-sm font-medium mb-1">Implementation</h6>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Complexity:</span>
                              <span className="font-medium capitalize">{measure.complexity || 'Moderate'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">Disruption:</span>
                              <span className="font-medium">
                                {measure.complexity === 'simple' ? 'Minimal' : 
                                 measure.complexity === 'moderate' ? 'Moderate' : 'Significant'}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground text-sm">Water Quality Impact:</span>
                              <span className="font-medium">Positive</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {measure.details && (
                        <div className="mt-4 pt-4 border-t">
                          <h6 className="text-sm font-medium mb-2">Implementation Details</h6>
                          <p className="text-sm">{measure.details}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          
          {/* Water Conservation Strategies */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Water Conservation Strategies</h4>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4">
                  Beyond the specific measures outlined above, we recommend the following broader water conservation practices:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h5 className="font-medium mb-2 text-blue-800">Water Management Plan</h5>
                    <p className="text-sm text-blue-800">
                      Implement a comprehensive water management plan that includes regular monitoring of water consumption, 
                      leak detection protocols, and maintenance schedules for water-using equipment. Establish water 
                      reduction targets and track progress over time.
                    </p>
                  </div>
                  
                  <div className="bg-cyan-50 p-4 rounded-md border border-cyan-100">
                    <h5 className="font-medium mb-2 text-cyan-800">Education and Awareness</h5>
                    <p className="text-sm text-cyan-800">
                      Educate building occupants about water conservation practices. Post signage in restrooms and 
                      kitchen areas promoting water conservation. Consider implementing a green team or sustainability 
                      committee to champion water conservation efforts.
                    </p>
                  </div>
                  
                  <div className="bg-teal-50 p-4 rounded-md border border-teal-100">
                    <h5 className="font-medium mb-2 text-teal-800">Water-Efficient Design</h5>
                    <p className="text-sm text-teal-800">
                      When renovating or replacing fixtures, select WaterSense labeled products. For landscape areas, 
                      consider xeriscaping or drought-resistant plantings that require minimal irrigation. Design 
                      irrigation systems with smart controllers and moisture sensors.
                    </p>
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-md border border-emerald-100">
                    <h5 className="font-medium mb-2 text-emerald-800">Water Reuse Systems</h5>
                    <p className="text-sm text-emerald-800">
                      Consider implementing water reuse systems such as rainwater harvesting or graywater recycling 
                      for appropriate applications like irrigation or toilet flushing. These systems can significantly 
                      reduce potable water consumption.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="mb-8 bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md text-center">
          <Droplet className="h-10 w-10 mx-auto mb-4 text-muted" />
          <h4 className="text-lg font-medium mb-2">No Water Measures Identified</h4>
          <p className="text-muted-foreground max-w-md mx-auto">
            No water efficiency measures have been identified yet. Recommendations will be added here once the water usage analysis is complete.
          </p>
        </div>
      )}
    </div>
  );
}; 