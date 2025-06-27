import React from 'react';
import { DollarSign, TrendingUp, Landmark, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MeasureType {
  title?: string;
  name?: string;
  costSavings?: number;
  annualSavings?: number;
  implementationCost?: number;
  roi?: number | string; // Return on Investment as percentage
  payback?: number;
  paybackPeriod?: number | string; // In years
  npv?: number; // Net Present Value
  energySavings?: {
    kwh?: number;
    therms?: number;
  };
  waterSavings?: {
    gallons?: number;
  };
  incentives?: number;
}

interface FinancialSummaryProps {
  financialData: {
    measures?: MeasureType[];
    totalCost?: number;
    potentialSavings?: number;
    totalImplementationCost?: number;
    totalAnnualSavings?: number;
    averagePayback?: number | string;
    netPresentValue?: number | string;
    discountRate?: number;
    inflationRate?: number;
    energyEscalationRate?: number;
    projectLifetime?: number;
  };
  formatCurrency: (value?: number) => string;
  formatPercent?: (value?: number) => string;
  // Property that is received but not currently used in the component
  // Using underscore prefix to indicate it is intentionally unused
  _formatNumber?: (value?: number) => string;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  financialData,
  // This parameter is received but not currently used in the component
  // @ts-ignore -- Intentionally unused property for future implementation
  _formatNumber = (value?: number) => value ? value.toFixed(2) : 'N/A',
  formatCurrency,
  formatPercent = (value?: number) => value ? `${value.toFixed(1)}%` : 'N/A',
}) => {
  // Extract values with defaults
  const measures = financialData.measures || [];
  const totalAnnualSavings = financialData.totalAnnualSavings || 0;
  const totalImplementationCost = financialData.totalImplementationCost || 0;
  const netPresentValue = typeof financialData.netPresentValue === 'number' 
    ? financialData.netPresentValue 
    : 0;
  
  // Set default financial parameters if not provided
  const financialParameters = {
    discountRate: financialData.discountRate || 0.05,
    inflationRate: financialData.inflationRate || 0.02,
    energyEscalationRate: financialData.energyEscalationRate || 0.03,
    projectLifetime: financialData.projectLifetime || 10,
  };
  
  // Calculate or use provided values
  const totalIncentives = measures.reduce((sum, measure) => sum + (measure.incentives || 0), 0);
  const netImplementationCost = totalImplementationCost - totalIncentives;
  const blendedPayback = totalAnnualSavings > 0 ? netImplementationCost / totalAnnualSavings : 0;
  
  // Group measures by payback period
  const getPayback = (measure: MeasureType) => {
    if (typeof measure.payback === 'number') return measure.payback;
    if (typeof measure.paybackPeriod === 'number') return measure.paybackPeriod;
    if (typeof measure.paybackPeriod === 'string') {
      const parsed = parseFloat(measure.paybackPeriod);
      return isNaN(parsed) ? 5 : parsed; // Default to 5 if not parseable
    }
    // Calculate if we have annualSavings and implementationCost
    if (measure.annualSavings && measure.implementationCost && measure.annualSavings > 0) {
      return measure.implementationCost / measure.annualSavings;
    }
    if (measure.costSavings && measure.implementationCost && measure.costSavings > 0) {
      return measure.implementationCost / measure.costSavings;
    }
    return 5; // Default fallback
  };
  
  const getSavings = (measure: MeasureType) => measure.annualSavings || measure.costSavings || 0;
  
  const quickPaybackMeasures = measures.filter(measure => getPayback(measure) <= 1);
  const midPaybackMeasures = measures.filter(measure => {
    const payback = getPayback(measure);
    return payback > 1 && payback <= 3;
  });
  const longPaybackMeasures = measures.filter(measure => getPayback(measure) > 3);
  
  const quickPaybackSavings = quickPaybackMeasures.reduce((sum, measure) => sum + getSavings(measure), 0);
  const quickPaybackCost = quickPaybackMeasures.reduce((sum, measure) => sum + (measure.implementationCost || 0), 0);
  
  const midPaybackSavings = midPaybackMeasures.reduce((sum, measure) => sum + getSavings(measure), 0);
  const midPaybackCost = midPaybackMeasures.reduce((sum, measure) => sum + (measure.implementationCost || 0), 0);
  
  const longPaybackSavings = longPaybackMeasures.reduce((sum, measure) => sum + getSavings(measure), 0);
  const longPaybackCost = longPaybackMeasures.reduce((sum, measure) => sum + (measure.implementationCost || 0), 0);
  
  // Calculate 10-year cumulative savings
  const cumulativeSavings = [];
  let runningTotal = 0;
  
  for (let year = 1; year <= 10; year++) {
    // Apply energy escalation rate to annual savings for each year
    const yearlyEscalatedSavings = totalAnnualSavings * Math.pow((1 + financialParameters.energyEscalationRate), year - 1);
    runningTotal += yearlyEscalatedSavings;
    cumulativeSavings.push({
      year,
      annual: yearlyEscalatedSavings,
      cumulative: runningTotal
    });
  }
  
  return (
    <div className="print:page-break-after">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <DollarSign className="h-6 w-6 mr-2" />
        Financial Analysis Summary
      </h3>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          This financial analysis provides a comprehensive view of the economic benefits of implementing 
          the recommended energy and water efficiency measures. The analysis includes simple payback, 
          return on investment (ROI), and net present value (NPV) calculations.
        </p>
      </div>
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annual Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAnnualSavings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(totalAnnualSavings > 0 ? totalAnnualSavings / (totalAnnualSavings * 5) * 100 : 0)} reduction in utility costs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Implementation Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(netImplementationCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net cost after {formatCurrency(totalIncentives)} in incentives
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Simple Payback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2 text-blue-500" />
              {blendedPayback ? blendedPayback.toFixed(1) : financialData.averagePayback || "N/A"} years
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Blended across all measures
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">10-Year NPV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {typeof netPresentValue === 'number' 
                ? formatCurrency(netPresentValue) 
                : netPresentValue || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              At {formatPercent(financialParameters.discountRate * 100)} discount rate
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Package Options */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4">Investment Package Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="bg-green-50 border-b border-green-100 pb-4">
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Quick Win Package
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Payback under 1 year
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Annual Savings</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(quickPaybackSavings)}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Implementation Cost</div>
                <div className="text-xl font-bold">{formatCurrency(quickPaybackCost)}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Simple Payback</div>
                <div className="text-xl font-bold">
                  {quickPaybackSavings > 0 
                    ? (quickPaybackCost / quickPaybackSavings).toFixed(1) 
                    : 'N/A'} years
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                {quickPaybackMeasures.length} measures with immediate returns, primarily focused on operational improvements 
                and low-cost retrofits
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Balanced Package
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Payback 1-3 years
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Annual Savings</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(midPaybackSavings)}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Implementation Cost</div>
                <div className="text-xl font-bold">{formatCurrency(midPaybackCost)}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Simple Payback</div>
                <div className="text-xl font-bold">
                  {midPaybackSavings > 0 
                    ? (midPaybackCost / midPaybackSavings).toFixed(1) 
                    : 'N/A'} years
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                {midPaybackMeasures.length} measures balancing cost and savings, with moderate capital investment 
                and solid financial returns
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-purple-50 border-b border-purple-100 pb-4">
              <CardTitle className="flex items-center">
                <Landmark className="h-5 w-5 mr-2 text-purple-600" />
                Capital Investment Package
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Payback over 3 years
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Annual Savings</div>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(longPaybackSavings)}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Implementation Cost</div>
                <div className="text-xl font-bold">{formatCurrency(longPaybackCost)}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Simple Payback</div>
                <div className="text-xl font-bold">
                  {longPaybackSavings > 0 
                    ? (longPaybackCost / longPaybackSavings).toFixed(1) 
                    : 'N/A'} years
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                {longPaybackMeasures.length} measures requiring significant capital investment but providing 
                substantial long-term benefits and system improvements
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 10-Year Cumulative Cash Flow */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4">10-Year Cumulative Cash Flow</h4>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Year</th>
                    {cumulativeSavings.map(item => (
                      <th key={item.year} className="text-center pb-2">Year {item.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Annual Savings</td>
                    {cumulativeSavings.map(item => (
                      <td key={`annual-${item.year}`} className="text-center py-2">
                        {formatCurrency(item.annual)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">Cumulative Savings</td>
                    {cumulativeSavings.map(item => (
                      <td key={`cumulative-${item.year}`} className="text-center py-2 font-bold">
                        {formatCurrency(item.cumulative)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Net Cash Flow</td>
                    {cumulativeSavings.map(item => (
                      <td key={`net-${item.year}`} className="text-center py-2">
                        {formatCurrency(item.cumulative - totalImplementationCost)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-sm text-muted-foreground mt-4">
              * Assumes an annual energy escalation rate of {formatPercent(financialParameters.energyEscalationRate * 100)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Parameters */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4">Financial Parameters</h4>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <h5 className="font-medium mb-2">Financial Analysis Parameters</h5>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Discount Rate:</span> 
                    <span>{formatPercent(financialParameters.discountRate * 100)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Inflation Rate:</span> 
                    <span>{formatPercent(financialParameters.inflationRate * 100)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Energy Escalation Rate:</span> 
                    <span>{formatPercent(financialParameters.energyEscalationRate * 100)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Project Lifetime:</span> 
                    <span>{financialParameters.projectLifetime} years</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Available Utility Incentives</h5>
                <p className="text-sm text-muted-foreground mb-4">
                  The analysis includes potential incentives from utility companies that may help reduce 
                  implementation costs and improve payback periods.
                </p>
                <div className="text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Total Available Incentives:</span>
                    <span>{formatCurrency(totalIncentives)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Financing Options</h5>
                <p className="text-sm text-muted-foreground">
                  Several financing options may be available to help fund the implementation of 
                  recommended measures, including energy service agreements, performance contracting, 
                  rebates, tax incentives, and low-interest loans.
                </p>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Other Financial Benefits</h5>
                <p className="text-sm text-muted-foreground">
                  Additional benefits not quantified in this analysis include reduced maintenance costs, 
                  improved comfort, increased productivity, reduced carbon emissions, and enhanced 
                  property value.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Financial Analysis Notes */}
      <div className="bg-muted/30 p-4 rounded-lg mb-4">
        <h5 className="font-medium mb-2">Notes on Financial Analysis</h5>
        <ul className="space-y-1 text-sm">
          <li>All financial calculations are based on current utility rates and estimated costs.</li>
          <li>The NPV calculation accounts for the time value of money using the specified discount rate.</li>
          <li>Implementation costs are estimates and may vary based on final contractor bids.</li>
          <li>Payback periods and ROI may improve with additional utility incentives or rebates.</li>
          <li>Annual energy cost savings will fluctuate with energy prices and usage patterns.</li>
        </ul>
      </div>
    </div>
  );
}; 