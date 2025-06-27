import React from 'react';
import { Zap, TrendingDown, Lightbulb, Thermometer, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EnergyMeasure {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  annualSavings?: {
    kwh?: number;
    therms?: number;
    cost?: number;
  };
  implementationCost?: number;
  paybackPeriod?: number;
  co2Reduction?: number;
  priority?: 'high' | 'medium' | 'low';
  complexity?: 'simple' | 'moderate' | 'complex';
  details?: string;
}

interface EnergyConservationMeasuresProps {
  measures?: EnergyMeasure[];
  // Required formatting functions
  formatNumber: (value?: number) => string;
  formatCurrency: (value?: number) => string;
  // Properties that are received but not currently used in the component
  // Using underscore prefix to indicate they are intentionally unused
  _equipment?: any[];
  _formatPercent?: (value?: number) => string;
}

export const EnergyConservationMeasures: React.FC<EnergyConservationMeasuresProps> = ({
  measures = [],
  // @ts-ignore -- Intentionally unused property for future implementation
  _equipment = [],
  formatNumber,
  formatCurrency,
  // @ts-ignore -- Intentionally unused property for future implementation
  _formatPercent = (value?: number) => value ? `${value.toFixed(1)}%` : 'N/A',
}) => {
  // Group measures by category
  const measuresByCategory: Record<string, EnergyMeasure[]> = {};
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
    if (lowerCategory.includes('hvac') || lowerCategory.includes('heating') || lowerCategory.includes('cooling')) {
      return <Thermometer className="h-5 w-5 mr-2" />;
    } else if (lowerCategory.includes('lighting')) {
      return <Lightbulb className="h-5 w-5 mr-2" />;
    } else if (lowerCategory.includes('envelope') || lowerCategory.includes('insulation')) {
      return <Building className="h-5 w-5 mr-2" />;
    } else {
      return <Zap className="h-5 w-5 mr-2" />;
    }
  };
  
  // Get color for priority
  const getPriorityColor = (priority: string = 'medium') => {
    switch (priority) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-slate-600 bg-slate-50 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };
  
  // Calculate totals
  const totalKwhSavings = measures.reduce((sum, measure) => 
    sum + (measure.annualSavings?.kwh || 0), 0);
  const totalThermsSavings = measures.reduce((sum, measure) => 
    sum + (measure.annualSavings?.therms || 0), 0);
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
        <TrendingDown className="h-6 w-6 mr-2" />
        Energy Conservation Measures
      </h3>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          The following energy conservation measures (ECMs) were identified based on the site assessment, utility bill analysis, 
          and building systems evaluation. Each measure is analyzed for energy savings, cost reduction, implementation cost, 
          and return on investment.
        </p>
      </div>
      
      {measures.length > 0 ? (
        <>
          {/* Summary of Measures */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Summary of Energy Measures</h4>
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Measure</TableHead>
                      <TableHead>Annual Energy Savings</TableHead>
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
                          {(measure.annualSavings?.kwh ?? 0) > 0 && (
                            <div>{formatNumber(measure.annualSavings?.kwh)} kWh</div>
                          )}
                          {(measure.annualSavings?.therms ?? 0) > 0 && (
                            <div>{formatNumber(measure.annualSavings?.therms)} therms</div>
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
                          {formatNumber(totalKwhSavings)} kWh
                        </div>
                        <div>
                          {formatNumber(totalThermsSavings)} therms
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
                          <h6 className="text-sm font-medium mb-1">Annual Energy Savings</h6>
                          <div className="space-y-1">
                            {(measure.annualSavings?.kwh ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">Electricity:</span>
                                <span className="font-medium">{formatNumber(measure.annualSavings?.kwh)} kWh</span>
                              </div>
                            )}
                            {(measure.annualSavings?.therms ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">Natural Gas:</span>
                                <span className="font-medium">{formatNumber(measure.annualSavings?.therms)} therms</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t">
                              <span className="text-muted-foreground text-sm">CO₂ Reduction:</span>
                              <span className="font-medium">{formatNumber(measure.co2Reduction || 0)} tonnes/yr</span>
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
                              <span className="text-muted-foreground text-sm">Maintenance Impact:</span>
                              <span className="font-medium">Reduced</span>
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
          
          {/* Implementation Strategy */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Implementation Strategy</h4>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-4">
                  We recommend implementing these energy conservation measures in phases to maximize 
                  savings while managing capital expenditures:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-green-50 p-4 rounded-md border border-green-100">
                    <h5 className="font-medium mb-2 text-green-800">Phase 1: Quick Wins (0-6 months)</h5>
                    <p className="text-sm text-green-800 mb-2">
                      Implement high-priority measures with payback periods under 2 years and low implementation costs.
                    </p>
                    <ul className="text-sm space-y-1 text-green-800">
                      {measures
                        .filter(m => (m.paybackPeriod || 99) < 2 && (m.priority === 'high' || m.complexity === 'simple'))
                        .slice(0, 3)
                        .map((m, i) => (
                          <li key={i}>{m.name} - {formatCurrency(m.annualSavings?.cost)}/year</li>
                        ))}
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h5 className="font-medium mb-2 text-blue-800">Phase 2: Core Improvements (6-18 months)</h5>
                    <p className="text-sm text-blue-800 mb-2">
                      Implement measures with moderate complexity and strong ROI.
                    </p>
                    <ul className="text-sm space-y-1 text-blue-800">
                      {measures
                        .filter(m => ((m.paybackPeriod || 99) >= 2 && (m.paybackPeriod || 99) < 5) || m.priority === 'medium')
                        .slice(0, 3)
                        .map((m, i) => (
                          <li key={i}>{m.name} - {formatCurrency(m.annualSavings?.cost)}/year</li>
                        ))}
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                    <h5 className="font-medium mb-2 text-purple-800">Phase 3: Capital Projects (18+ months)</h5>
                    <p className="text-sm text-purple-800 mb-2">
                      Plan and implement larger capital projects with longer payback periods that may require more detailed 
                      engineering analysis and significant investment.
                    </p>
                    <ul className="text-sm space-y-1 text-purple-800">
                      {measures
                        .filter(m => (m.paybackPeriod || 0) >= 5 || m.complexity === 'complex')
                        .slice(0, 3)
                        .map((m, i) => (
                          <li key={i}>{m.name} - {formatCurrency(m.annualSavings?.cost)}/year</li>
                        ))}
                    </ul>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground border-t pt-4">
                  <p className="mb-2">
                    <span className="font-medium">Note on Bundling Measures:</span> Consider implementing related measures together to reduce overall implementation 
                    costs and minimize disruption to building operations. For example, lighting upgrades should be done simultaneously 
                    across similar areas.
                  </p>
                  <p>
                    <span className="font-medium">Utility Incentives:</span> Many of these measures may qualify for utility incentives or rebates that will 
                    improve payback periods. We recommend consulting with your utility provider about available programs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="mb-8 bg-muted/20 border-2 border-dashed border-muted p-8 rounded-md text-center">
          <TrendingDown className="h-10 w-10 mx-auto mb-4 text-muted" />
          <h4 className="text-lg font-medium mb-2">No Energy Measures Identified</h4>
          <p className="text-muted-foreground max-w-md mx-auto">
            No energy conservation measures have been identified yet. Recommendations will be added here once the energy analysis is complete.
          </p>
        </div>
      )}
    </div>
  );
}; 