import React from 'react';
import { FileText, ClipboardCheck, Calculator, Table2, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface AppendixItem {
  id: string;
  title: string;
  description: string;
  type: 'methodology' | 'calculation' | 'data' | 'reference';
  content?: React.ReactNode;
}

interface AppendicesProps {
  appendices: AppendixItem[];
}

export const Appendices: React.FC<AppendicesProps> = ({
  appendices,
}) => {
  // Group appendices by type
  const methodologyAppendices = appendices.filter(item => item.type === 'methodology');
  const calculationAppendices = appendices.filter(item => item.type === 'calculation');
  const dataAppendices = appendices.filter(item => item.type === 'data');
  const referenceAppendices = appendices.filter(item => item.type === 'reference');
  
  // Helper function to get the appropriate icon based on appendix type
  const renderAppendixIcon = (type: string) => {
    switch (type) {
      case 'methodology':
        return <ClipboardCheck className="h-5 w-5 mr-2" />;
      case 'calculation':
        return <Calculator className="h-5 w-5 mr-2" />;
      case 'data':
        return <Table2 className="h-5 w-5 mr-2" />;
      case 'reference':
        return <Info className="h-5 w-5 mr-2" />;
      default:
        return <FileText className="h-5 w-5 mr-2" />;
    }
  };
  
  return (
    <div className="print:page-break-after">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FileText className="h-6 w-6 mr-2" />
        Appendices
      </h3>
      
      <div className="mb-6">
        <p className="text-muted-foreground">
          The following appendices provide additional information, methodologies, calculations, 
          and supporting data for the findings and recommendations presented in this report.
        </p>
      </div>
      
      {/* Appendix Table of Contents */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-4">Appendix Contents</h4>
        <Card>
          <CardContent className="pt-6">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4 font-medium">ID</th>
                  <th className="text-left py-2 px-4 font-medium">Title</th>
                  <th className="text-left py-2 px-4 font-medium">Category</th>
                  <th className="text-left py-2 px-4 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {appendices.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-4">{item.id}</td>
                    <td className="py-2 px-4 font-medium">{item.title}</td>
                    <td className="py-2 px-4 capitalize">{item.type}</td>
                    <td className="py-2 px-4 text-muted-foreground">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
      
      {/* Appendices by Category */}
      <div className="space-y-6">
        {/* Methodology Appendices */}
        {methodologyAppendices.length > 0 && (
          <div>
            <h4 className="text-lg font-medium mb-4 flex items-center">
              {renderAppendixIcon('methodology')}
              Methodology Appendices
            </h4>
            <Accordion type="multiple" className="space-y-4">
              {methodologyAppendices.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-md">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center text-left">
                      <span className="text-muted-foreground mr-2">{item.id}</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <div className="text-muted-foreground mb-4">{item.description}</div>
                    {item.content ? (
                      <div>{item.content}</div>
                    ) : (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <h5 className="font-medium mb-2">Analysis Methodology</h5>
                        <ul className="space-y-2 list-disc list-inside text-sm">
                          <li>Data collection approach and parameters measured</li>
                          <li>Calculation methodology for energy consumption and savings estimates</li>
                          <li>Modeling assumptions and adjustment factors</li>
                          <li>Standards and protocols followed (ASHRAE, IPMVP, etc.)</li>
                          <li>Quality assurance and validation methods</li>
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        
        {/* Calculation Appendices */}
        {calculationAppendices.length > 0 && (
          <div>
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Calculation Appendices
            </h4>
            <Accordion type="multiple" className="space-y-4">
              {calculationAppendices.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-md">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center text-left">
                      <span className="text-muted-foreground mr-2">{item.id}</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <div className="text-muted-foreground mb-4">{item.description}</div>
                    {item.content ? (
                      <div>{item.content}</div>
                    ) : (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <h5 className="font-medium mb-2">Detailed Calculations</h5>
                        <p className="text-sm mb-4">
                          This appendix provides detailed calculations for energy consumption, savings estimates,
                          and financial projections presented in the report.
                        </p>
                        <div className="bg-white p-4 border rounded-md text-sm">
                          <pre className="whitespace-pre-wrap">
                            {`Example calculation for measure ECM-01:
                            
Annual Energy Savings:
Baseline Energy Use: 250,000 kWh/year
Proposed Energy Use: 175,000 kWh/year
Energy Savings: 75,000 kWh/year (30% reduction)

Annual Cost Savings:
Electricity Rate: $0.12/kWh
Cost Savings: 75,000 kWh × $0.12/kWh = $9,000/year

Implementation Cost: $27,000

Simple Payback Period:
$27,000 ÷ $9,000/year = 3.0 years`}
                          </pre>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        
        {/* Data Appendices */}
        {dataAppendices.length > 0 && (
          <div>
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <Table2 className="h-5 w-5 mr-2" />
              Data Appendices
            </h4>
            <Accordion type="multiple" className="space-y-4">
              {dataAppendices.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-md">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center text-left">
                      <span className="text-muted-foreground mr-2">{item.id}</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <div className="text-muted-foreground mb-4">{item.description}</div>
                    {item.content ? (
                      <div>{item.content}</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-muted/30">
                            <tr>
                              <th scope="col" className="px-4 py-2 text-left">Date</th>
                              <th scope="col" className="px-4 py-2 text-left">Electricity (kWh)</th>
                              <th scope="col" className="px-4 py-2 text-left">Gas (therms)</th>
                              <th scope="col" className="px-4 py-2 text-left">Water (gallons)</th>
                              <th scope="col" className="px-4 py-2 text-left">Cost ($)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {[...Array(12)].map((_, i) => (
                              <tr key={i}>
                                <td className="px-4 py-2">{`${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]} 2023`}</td>
                                <td className="px-4 py-2">{Math.floor(Math.random() * 30000 + 20000)}</td>
                                <td className="px-4 py-2">{Math.floor(Math.random() * 1000 + 500)}</td>
                                <td className="px-4 py-2">{Math.floor(Math.random() * 50000 + 30000)}</td>
                                <td className="px-4 py-2">${Math.floor(Math.random() * 5000 + 3000)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        
        {/* Reference Appendices */}
        {referenceAppendices.length > 0 && (
          <div>
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Reference Appendices
            </h4>
            <Accordion type="multiple" className="space-y-4">
              {referenceAppendices.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border rounded-md">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center text-left">
                      <span className="text-muted-foreground mr-2">{item.id}</span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4">
                    <div className="text-muted-foreground mb-4">{item.description}</div>
                    {item.content ? (
                      <div>{item.content}</div>
                    ) : (
                      <div className="bg-muted/20 p-4 rounded-md">
                        <h5 className="font-medium mb-2">References & Standards</h5>
                        <ul className="space-y-2 list-disc list-inside text-sm">
                          <li>ASHRAE Standard 90.1-2019: Energy Standard for Buildings Except Low-Rise Residential Buildings</li>
                          <li>ASHRAE Standard 62.1-2019: Ventilation for Acceptable Indoor Air Quality</li>
                          <li>International Performance Measurement and Verification Protocol (IPMVP)</li>
                          <li>Local energy code requirements and utility incentive program guidelines</li>
                          <li>U.S. Department of Energy's Building Energy Asset Score Technical Documentation</li>
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
      
      {/* Additional Resources */}
      <div className="mt-8 mb-6">
        <h4 className="text-lg font-medium mb-4">Additional Resources</h4>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h5 className="font-medium mb-2">Utility Incentive Programs</h5>
                <p className="text-sm text-muted-foreground">
                  Information on available utility incentives, rebates, and energy efficiency programs 
                  that can help offset the cost of implementing the recommended measures.
                </p>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Energy Management Best Practices</h5>
                <p className="text-sm text-muted-foreground">
                  Guidance on implementing an effective energy management program, including staff training, 
                  monitoring protocols, and continuous improvement strategies.
                </p>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Financing Options</h5>
                <p className="text-sm text-muted-foreground">
                  Overview of available financing mechanisms, including on-bill financing, energy service agreements, 
                  property assessed clean energy (PACE) financing, and traditional loans.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-lg mb-4">
        <h5 className="font-medium mb-2">Notes on Appendices</h5>
        <p className="text-sm text-muted-foreground">
          The information provided in these appendices is intended to support the findings and recommendations 
          presented in the main report. For detailed spreadsheets, modeling files, or other extended documentation, 
          please contact the audit team. Digital versions of all calculations are available upon request.
        </p>
      </div>
    </div>
  );
}; 