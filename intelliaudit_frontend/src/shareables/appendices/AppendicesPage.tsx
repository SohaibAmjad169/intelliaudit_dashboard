import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ClipboardCheck, 
  Calculator, 
  Table2,
  Info,
  ChevronRight,
  ExternalLink,
  Download,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Flame,
  Sparkles,
  Award,
  Shield
} from 'lucide-react';
import { useProjectOverview } from '../hooks/useProjectOverview';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { NavigationButtons } from '../components/NavigationButtons';

// Reusable Callout Badge component  
interface CalloutBadgeProps {
  type: 'success' | 'warning' | 'alert' | 'priority' | 'info';
  text: string;
  pulse?: boolean;
}

const CalloutBadge: React.FC<CalloutBadgeProps> = ({ type, text, pulse = false }) => {
  const baseClasses = "absolute -top-3 -right-3 px-2 py-1 text-xs font-bold rounded-full shadow-lg z-20 flex items-center gap-1 border-2 border-white dark:border-gray-800";
  
  const typeStyles = {
    success: "bg-green-500 text-white",
    warning: "bg-yellow-500 text-white", 
    alert: "bg-red-500 text-white",
    priority: "bg-blue-500 text-white",
    info: "bg-purple-500 text-white"
  };

  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    alert: AlertTriangle,
    priority: Award,
    info: Shield
  };

  const Icon = icons[type];
  
  return (
    <div className={`${baseClasses} ${typeStyles[type]} ${pulse ? 'animate-pulse' : ''}`}>
      <Icon className="h-3 w-3" />
      <span>{text}</span>
    </div>
  );
};

// Drill-down modal component
interface DrillDownModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="hover:bg-muted">✕</Button>
        </div>
        <div className="p-6 bg-background">
          {children}
        </div>
      </div>
    </div>
  );
};

// Top-level summary card component
interface SummaryCardProps {
  title: string;
  icon: React.ComponentType<any>;
  summary: string;
  metrics?: { label: string; value: string }[];
  onDrillDown: () => void;
  badge?: string;
  callout?: {
    type: 'success' | 'warning' | 'alert' | 'priority' | 'info';
    text: string;
    pulse?: boolean;
  };
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  icon: Icon, 
  summary, 
  metrics = [], 
  onDrillDown, 
  badge,
  callout
}) => {
  // Dynamic styling based on card title for more visual variety
  const getCardStyling = (title: string) => {
    if (title.includes('Methodology') || title.includes('Documentation')) {
      return "border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/10 dark:via-background dark:to-purple-950/10 hover:shadow-purple-200/50";
    } else if (title.includes('Calculation') || title.includes('Details')) {
      return "border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-blue-950/10 dark:via-background dark:to-blue-950/10 hover:shadow-blue-200/50";
    } else if (title.includes('Data') || title.includes('Tables')) {
      return "border-green-300 bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-green-950/10 dark:via-background dark:to-green-950/10 hover:shadow-green-200/50";
    } else if (title.includes('References') || title.includes('Standards')) {
      return "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-orange-950/10 dark:via-background dark:to-orange-950/10 hover:shadow-orange-200/50";
    } else if (title.includes('Resources') || title.includes('Additional')) {
      return "border-teal-300 bg-gradient-to-br from-teal-50 via-white to-teal-50 dark:from-teal-950/10 dark:via-background dark:to-teal-950/10 hover:shadow-teal-200/50";
    } else if (title.includes('Download') || title.includes('Center')) {
      return "border-indigo-300 bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-indigo-950/10 dark:via-background dark:to-indigo-950/10 hover:shadow-indigo-200/50";
    }
    return "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950/10 dark:via-background dark:to-slate-950/10 hover:shadow-slate-200/50";
  };

  const getIconColor = (title: string) => {
    if (title.includes('Methodology') || title.includes('Documentation')) return "text-purple-600";
    if (title.includes('Calculation') || title.includes('Details')) return "text-blue-600";
    if (title.includes('Data') || title.includes('Tables')) return "text-green-600";
    if (title.includes('References') || title.includes('Standards')) return "text-orange-600";
    if (title.includes('Resources') || title.includes('Additional')) return "text-teal-600";
    if (title.includes('Download') || title.includes('Center')) return "text-indigo-600";
    return "text-slate-600";
  };

  return (
    <Card className={`h-full flex flex-col relative overflow-visible transition-all duration-300 hover:shadow-lg ${getCardStyling(title)}`}>
      {callout && (
        <CalloutBadge 
          type={callout.type} 
          text={callout.text} 
          pulse={callout.pulse} 
        />
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${getIconColor(title)}`} />
            <span className="text-foreground">{title}</span>
            {badge && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{badge}</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={onDrillDown} className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <p className="text-sm text-muted-foreground mb-4">{summary}</p>
        
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg border border-white/20 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">{metric.label}</div>
                <div className="font-semibold text-foreground">{metric.value}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-auto">
          <Button variant="outline" size="sm" onClick={onDrillDown} className="w-full hover:bg-white/50 dark:hover:bg-black/20">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const AppendicesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { project, isLoading } = useProjectOverview(projectId);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-6">Loading appendices...</div>;
  }

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  // Sample appendices data
  const appendicesCount = {
    methodology: 3,
    calculations: 5,
    data: 4,
    references: 6,
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pt-16 lg:pt-6">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950/20 dark:via-background dark:to-indigo-950/20 rounded-xl border border-border shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">Appendices & Documentation</h1>
              <p className="text-purple-700 dark:text-purple-300 font-medium">
                Supporting documentation and reference materials for {project.name}
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-muted-foreground">Documentation Status</div>
              <div className="text-lg font-semibold text-foreground">Complete</div>
            </div>
          </div>
          
          {/* Documentation Details - Enhanced */}
          <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md">
                  <ClipboardCheck className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Methodologies</div>
                  <div className="font-medium text-foreground">{appendicesCount.methodology} documents</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                  <Calculator className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Calculations</div>
                  <div className="font-medium text-foreground">{appendicesCount.calculations} detailed</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Table2 className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Data Tables</div>
                  <div className="font-medium text-foreground">{appendicesCount.data} complete</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                  <Info className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">References</div>
                  <div className="font-medium text-foreground">{appendicesCount.references} standards</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="text-center space-y-2">
        {/* <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-purple-600" />
          Appendices & Documentation
        </h1> */}
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Methodologies, calculations, and reference materials supporting the audit analysis
        </p>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mx-4">
        <Card className="relative overflow-visible border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {appendicesCount.methodology}
            </div>
            <div className="text-sm text-purple-700/80 dark:text-purple-300/80">Methodology Docs</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appendicesCount.calculations}
            </div>
            <div className="text-sm text-blue-700/80 dark:text-blue-300/80">Calculation Details</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appendicesCount.data}
            </div>
            <div className="text-sm text-green-700/80 dark:text-green-300/80">Data Tables</div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-visible border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {appendicesCount.references}
            </div>
            <div className="text-sm text-orange-700/80 dark:text-orange-300/80">References & Standards</div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-4 mb-8">
        
        {/* Methodology Documentation */}
        <SummaryCard
          title="Methodology Documentation"
          icon={ClipboardCheck}
          summary="Detailed methodologies and approaches used for energy analysis, water assessment, and retro-commissioning evaluation."
          metrics={[
            { label: "Analysis Methods", value: "ASHRAE Standards" },
            { label: "Verification", value: "IPMVP Protocol" }
          ]}
          onDrillDown={() => setActiveModal('methodology')}
        />

        {/* Calculation Details */}
        <SummaryCard
          title="Calculation Details"
          icon={Calculator}
          summary="Comprehensive calculations for energy savings, cost analysis, payback periods, and financial projections."
          metrics={[
            { label: "Energy Calculations", value: "5 documents" },
            { label: "Financial Models", value: "ROI & NPV" }
          ]}
          onDrillDown={() => setActiveModal('calculations')}
        />

        {/* Data Tables */}
        <SummaryCard
          title="Data Tables & Charts"
          icon={Table2}
          summary="Raw data, utility bill analysis, monthly consumption patterns, and baseline energy usage information."
          metrics={[
            { label: "Utility Data", value: "24 months" },
            { label: "Equipment Lists", value: "Complete inventory" }
          ]}
          onDrillDown={() => setActiveModal('data')}
        />

        {/* References & Standards */}
        <SummaryCard
          title="References & Standards"
          icon={Info}
          summary="Industry standards, building codes, utility programs, and technical references used in the analysis."
          metrics={[
            { label: "Standards", value: "ASHRAE, IECC" },
            { label: "Programs", value: "Utility incentives" }
          ]}
          onDrillDown={() => setActiveModal('references')}
        />

        {/* Additional Resources */}
        <SummaryCard
          title="Additional Resources"
          icon={BookOpen}
          summary="Supplementary materials, best practices, implementation guides, and vendor information."
          metrics={[
            { label: "Resources", value: "Implementation guides" },
            { label: "Vendors", value: "Qualified contractors" }
          ]}
          onDrillDown={() => setActiveModal('resources')}
        />

        {/* Download Center */}
        <SummaryCard
          title="Download Center"
          icon={Download}
          summary="Access to downloadable reports, spreadsheets, documentation, and supporting files."
          metrics={[
            { label: "Report Formats", value: "PDF, Excel" },
            { label: "File Types", value: "Docs, Charts" }
          ]}
          onDrillDown={() => setActiveModal('downloads')}
        />
      </div>

      {/* Navigation */}
      <NavigationButtons currentPage="appendices" />

      {/* Drill-down Modals */}
      <DrillDownModal
        title="Methodology Documentation"
        isOpen={activeModal === 'methodology'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-6">
          <p className="text-muted-foreground">
            This section details the methodologies and standards used throughout the audit process.
          </p>
          
          <Accordion type="multiple" className="space-y-4">
            <AccordionItem value="energy-methodology" className="border rounded-md">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <span className="font-medium">Energy Audit Methodology</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4">
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>ASHRAE Level II Energy Audit procedures</li>
                  <li>Equipment inventory and operational assessment</li>
                  <li>Utility bill analysis and weather normalization</li>
                  <li>Building energy modeling and baseline establishment</li>
                  <li>Measure identification and savings calculations</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="water-methodology" className="border rounded-md">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <span className="font-medium">Water Audit Methodology</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4">
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>Water fixture survey and flow rate measurements</li>
                  <li>Irrigation system assessment and efficiency evaluation</li>
                  <li>Water bill analysis and usage pattern identification</li>
                  <li>Conservation measure evaluation and savings potential</li>
                  <li>Cost-benefit analysis for water efficiency upgrades</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="rcx-methodology" className="border rounded-md">
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <span className="font-medium">Retro-commissioning Methodology</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4">
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>Building systems functional testing and evaluation</li>
                  <li>Control sequence verification and optimization</li>
                  <li>Operational parameter adjustment and calibration</li>
                  <li>Performance monitoring and verification protocols</li>
                  <li>No-cost and low-cost improvement identification</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Calculation Details"
        isOpen={activeModal === 'calculations'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Detailed calculations and financial analysis supporting all recommendations.
          </p>
          
          <div className="bg-muted/20 p-4 rounded-md">
            <h5 className="font-medium mb-2">Sample Energy Savings Calculation</h5>
            <div className="bg-background p-4 border rounded-md text-sm font-mono">
              <pre className="whitespace-pre-wrap">
{`Lighting Upgrade - LED Conversion:

Existing System:
- 100 fixtures × 32W fluorescent = 3,200W
- Operating hours: 4,000 hours/year
- Annual consumption: 12,800 kWh/year

Proposed System:
- 100 fixtures × 18W LED = 1,800W
- Operating hours: 4,000 hours/year
- Annual consumption: 7,200 kWh/year

Energy Savings:
- Annual savings: 5,600 kWh/year (44% reduction)
- Cost savings: 5,600 kWh × $0.12/kWh = $672/year

Financial Analysis:
- Implementation cost: $2,500
- Simple payback: $2,500 ÷ $672/year = 3.7 years
- 20-year NPV (6% discount): $6,234`}
              </pre>
            </div>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Data Tables & Charts"
        isOpen={activeModal === 'data'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Raw data tables and supporting documentation for the audit analysis.
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left">Month</th>
                  <th className="px-4 py-2 text-left">Electricity (kWh)</th>
                  <th className="px-4 py-2 text-left">Gas (therms)</th>
                  <th className="px-4 py-2 text-left">Water (HCF)</th>
                  <th className="px-4 py-2 text-left">Total Cost ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...Array(12)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]} 2024</td>
                    <td className="px-4 py-2">{(Math.random() * 10000 + 15000).toFixed(0)}</td>
                    <td className="px-4 py-2">{(Math.random() * 500 + 300).toFixed(0)}</td>
                    <td className="px-4 py-2">{(Math.random() * 50 + 200).toFixed(1)}</td>
                    <td className="px-4 py-2">${(Math.random() * 2000 + 3000).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="References & Standards"
        isOpen={activeModal === 'references'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Industry standards and references used in the audit process.
          </p>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Energy Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                <li>ASHRAE Standard 90.1-2019: Energy Standard for Buildings</li>
                <li>ASHRAE Standard 62.1-2019: Ventilation for Acceptable Indoor Air Quality</li>
                <li>International Performance Measurement and Verification Protocol (IPMVP)</li>
                <li>ENERGY STAR Portfolio Manager benchmarking methodology</li>
              </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Water Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                <li>EPA WaterSense specifications for fixtures and appliances</li>
                <li>ASPE/IAPMO/ICC 301-2019: Water Efficiency and Sanitation Standard</li>
                <li>California Title 24 water efficiency requirements</li>
              </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Commissioning Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
              <ul className="list-disc list-inside dark:text-gray-200 space-y-1 pl-2">
                <li>ASHRAE Guideline 0-2019: The Commissioning Process</li>
                <li>ASHRAE Guideline 1.1-2007: HVAC&R Technical Requirements</li>
                <li>Building Commissioning Association (BCA) Best Practices</li>
              </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Additional Resources"
        isOpen={activeModal === 'resources'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Additional resources to support implementation of recommendations.
          </p>
          
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4">
                <h5 className="font-medium mb-2">Implementation Guides</h5>
                <p className="text-sm text-muted-foreground">
                  Step-by-step guides for implementing energy efficiency measures, 
                  including vendor selection, project management, and commissioning procedures.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h5 className="font-medium mb-2">Financing Options</h5>
                <p className="text-sm text-muted-foreground">
                  Information on utility rebates, tax incentives, PACE financing, 
                  and other funding mechanisms available for energy efficiency projects.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h5 className="font-medium mb-2">Qualified Contractors</h5>
                <p className="text-sm text-muted-foreground">
                  Directory of pre-qualified contractors and vendors specializing in 
                  energy efficiency installations and building system improvements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>

      <DrillDownModal
        title="Download Center"
        isOpen={activeModal === 'downloads'}
        onClose={() => setActiveModal(null)}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Download reports and supporting documentation.
          </p>
          
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Complete Audit Report</h5>
                    <p className="text-sm text-muted-foreground">Full PDF report with all findings and recommendations</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Financial Analysis Spreadsheet</h5>
                    <p className="text-sm text-muted-foreground">Excel workbook with detailed calculations</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Equipment Specifications</h5>
                    <p className="text-sm text-muted-foreground">Technical specifications for recommended equipment</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Specs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DrillDownModal>
    </div>
  );
}; 